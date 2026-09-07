import { DecisionCriterion, DecisionRequirement, Vendor, VendorScoreBreakdown } from "@/types";
import { CATEGORY_KEYWORDS, ALL_CATEGORIES, FEATURE_KEYWORDS, PRIORITY_KEYWORDS } from "@/lib/demo-data/categories";
import { newId } from "@/lib/store/db";

/**
 * AIService
 * ---------
 * A single, provider-agnostic gateway to language-model calls. It never
 * decides a score and never invents vendor facts — it only (a) helps turn
 * free text into structured fields, and (b) writes plain-English narration
 * over numbers ScoringService already computed.
 *
 * If OPENAI_API_KEY (or OPENAI_BASE_URL for any OpenAI-compatible provider)
 * is not configured, or the call fails for any reason, every method falls
 * back to a deterministic, template-based implementation so the product
 * works fully offline. This fallback path is what demo mode always uses.
 */

export interface RequirementExtraction {
  category: string;
  companySize?: number;
  budgetMin?: number;
  budgetMax?: number;
  billingFrequency: "monthly" | "annual" | "one_time";
  requiredFeatures: string[];
  preferredFeatures: string[];
  priorities: string[];
  integrationRequirements: string[];
  confidence: number;
  source: "openai" | "demo-fallback";
}

function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function callOpenAICompatible(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!hasOpenAIConfig()) return null;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ---------- Deterministic fallback extraction ----------

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  let best: { category: string; hits: number } = { category: ALL_CATEGORIES[0], hits: 0 };
  for (const category of ALL_CATEGORIES) {
    const hits = CATEGORY_KEYWORDS[category].filter((k) => lower.includes(k)).length;
    if (hits > best.hits) best = { category, hits };
  }
  return best.category;
}

function detectCompanySize(text: string): number | undefined {
  const match = text.match(/(\d{1,5})\s*[-\s]?\s*(person|people|employee|employees|staff|fte)/i);
  return match ? Number(match[1]) : undefined;
}

function detectBudget(text: string): { min?: number; max?: number; frequency: "monthly" | "annual" | "one_time" } {
  const match = text.match(/[£$€]\s?([\d,]+(?:\.\d+)?)\s*(k)?\s*(?:per|\/)?\s*(month|monthly|year|annum|annual|yr)?/i);
  if (!match) return { frequency: "monthly" };
  let amount = Number(match[1].replace(/,/g, ""));
  if (match[2]) amount *= 1000;
  const freqRaw = (match[3] || "month").toLowerCase();
  const frequency: "monthly" | "annual" = freqRaw.startsWith("y") || freqRaw.startsWith("annum") || freqRaw.startsWith("annual") ? "annual" : "monthly";
  return { min: Math.round(amount * 0.6), max: amount, frequency };
}

const FEATURE_SYNONYMS: Record<string, string> = {
  "automated email workflows": "email automation",
  "email workflows": "email automation",
  "email campaigns": "email automation",
  "automated workflows": "automation",
  "sprint planning": "sprint planning",
};

function detectFeatures(text: string): string[] {
  const lower = text.toLowerCase();
  const direct = FEATURE_KEYWORDS.filter((f) => lower.includes(f));
  const viaSynonym = Object.entries(FEATURE_SYNONYMS)
    .filter(([phrase]) => lower.includes(phrase))
    .map(([, canonical]) => canonical);
  return Array.from(new Set([...direct, ...viaSynonym]));
}

function detectPriorities(text: string): string[] {
  const lower = text.toLowerCase();
  const found = PRIORITY_KEYWORDS.filter((p) => lower.includes(p));
  return found.length ? found : ["Balanced fit"];
}

function detectIntegrations(text: string): string[] {
  const knownTools = ["slack", "gmail", "outlook", "salesforce", "hubspot", "zapier", "stripe", "shopify", "microsoft teams", "google drive", "zoom"];
  const lower = text.toLowerCase();
  return knownTools.filter((t) => lower.includes(t)).map((t) => t.replace(/\b\w/g, (c) => c.toUpperCase()));
}

function fallbackExtraction(text: string): RequirementExtraction {
  const budget = detectBudget(text);
  return {
    category: detectCategory(text),
    companySize: detectCompanySize(text),
    budgetMin: budget.min,
    budgetMax: budget.max,
    billingFrequency: budget.frequency,
    requiredFeatures: detectFeatures(text),
    preferredFeatures: [],
    priorities: detectPriorities(text),
    integrationRequirements: detectIntegrations(text),
    confidence: 0.72,
    source: "demo-fallback",
  };
}

export const AIService = {
  hasLiveProvider: hasOpenAIConfig,

  async extractRequirement(text: string): Promise<RequirementExtraction> {
    const raw = await callOpenAICompatible(
      "You extract structured B2B software requirements from a business description. " +
        "Respond ONLY with compact JSON: {category, companySize, budgetMin, budgetMax, billingFrequency, requiredFeatures[], preferredFeatures[], priorities[], integrationRequirements[]}.",
      text
    );
    if (raw) {
      try {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return { ...fallbackExtraction(text), ...parsed, source: "openai", confidence: 0.9 };
      } catch {
        // fall through to deterministic extraction
      }
    }
    return fallbackExtraction(text);
  },

  /** Generates 3-5 clarification questions that would materially change scoring. */
  async generateClarificationQuestions(extraction: RequirementExtraction) {
    const questions: { id: string; question: string; options: string[]; rationale: string; order: number }[] = [];
    let order = 0;

    questions.push({
      id: newId("cq"),
      question: "How important is ease of implementation?",
      options: ["Essential", "Important", "Nice to have"],
      rationale: "Weights the implementation and usability dimensions of the scoring engine.",
      order: order++,
    });

    questions.push({
      id: newId("cq"),
      question: extraction.requiredFeatures.some((f) => f.includes("automation"))
        ? "How important are advanced automation workflows?"
        : "How important is automation across day-to-day workflows?",
      options: ["Essential", "Important", "Nice to have"],
      rationale: "Weights automation-related capabilities inside the feature score.",
      order: order++,
    });

    if (!extraction.budgetMax) {
      questions.push({
        id: newId("cq"),
        question: "What's a realistic monthly budget range for this software?",
        options: ["Under £200", "£200-£500", "£500-£1,500", "£1,500+"],
        rationale: "Anchors the price score; without it pricing is only scored relative to the category.",
        order: order++,
      });
    }

    questions.push({
      id: newId("cq"),
      question: "What matters more overall?",
      options: ["Lower cost", "More functionality", "Balanced"],
      rationale: "Sets the default weighting split between price and feature/functionality criteria.",
      order: order++,
    });

    if (extraction.integrationRequirements.length === 0) {
      questions.push({
        id: newId("cq"),
        question: "Are there any tools this software must integrate with?",
        options: ["Slack", "Google Workspace / Microsoft 365", "None critical"],
        rationale: "Feeds directly into the integration score.",
        order: order++,
      });
    }

    return questions.slice(0, 5);
  },

  /**
   * Narrates a recommendation using ONLY structured data already computed by
   * ScoringService and stored vendor facts — the model is never allowed to
   * introduce a price, feature, integration or certification that isn't
   * already present in `vendor` or `score`.
   */
  async explainRecommendation(
    vendor: Vendor,
    requirement: DecisionRequirement,
    criteria: DecisionCriterion[],
    score: VendorScoreBreakdown
  ) {
    const strengths = score.criteriaContributions
      .filter((c) => c.rawScore >= 80)
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 4)
      .map((c) => c.criterionName);

    const weaknesses = score.criteriaContributions
      .filter((c) => c.rawScore < 60)
      .sort((a, b) => a.rawScore - b.rawScore)
      .slice(0, 3)
      .map((c) => c.criterionName);

    const matchedRequired = requirement.requiredFeatures.filter((f) =>
      vendor.features.some((vf) => vf.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(vf.toLowerCase()))
    );

    const withinBudget = requirement.budgetMax ? vendor.startingPrice <= requirement.budgetMax : undefined;

    const raw = await callOpenAICompatible(
      "You write a short, factual explanation of a B2B software recommendation using ONLY the JSON facts given. " +
        "Never invent a price, feature, integration or certification that is not present in the JSON. Keep it to 2 sentences.",
      JSON.stringify({ vendor: vendor.name, strengths, weaknesses, matchedRequired, withinBudget, overall: score.overallScore })
    );

    const summary =
      raw?.trim() ||
      `${vendor.name} scores ${score.overallScore}% against your weighted criteria, driven by strong ${
        strengths[0]?.toLowerCase() || "overall fit"
      }${strengths[1] ? ` and ${strengths[1].toLowerCase()}` : ""}.` +
        (withinBudget === false ? " Note it currently sits above your stated budget." : "");

    return {
      summary,
      strengths,
      weaknesses,
      matchedRequired,
      evidenceNote: `Analysis based on ${score.evaluatedCriteria} criteria and ${score.evaluatedCapabilities} evaluated capabilities.`,
      source: raw ? ("openai" as const) : ("demo-fallback" as const),
    };
  },
};
