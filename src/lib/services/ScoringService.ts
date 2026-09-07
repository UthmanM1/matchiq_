import { DecisionCriterion, DecisionRequirement, Vendor, VendorScoreBreakdown } from "@/types";
import { clamp, round1 } from "@/lib/utils";

/**
 * ScoringService
 * ---------------
 * The single source of truth for how a vendor is scored against a decision.
 * Deliberately contains ZERO calls to any AI provider: every number here is
 * derived from structured requirement + criteria + vendor data using fixed
 * arithmetic, so the same inputs always produce the same outputs.
 */

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "for", "to", "with", "is", "are", "our", "we",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP_WORDS.has(t));
}

function textContainsPhrase(haystack: string[], phrase: string): boolean {
  const needle = tokens(phrase).join(" ");
  return haystack.some((h) => h.includes(needle) || needle.includes(h));
}

/** Fuzzy match ratio of `wanted` phrases found within a vendor's string list (features/integrations/security). */
function matchRatio(wanted: string[], available: string[]): number {
  if (wanted.length === 0) return -1; // sentinel: "not specified"
  const haystack = available.map((a) => a.toLowerCase());
  let matched = 0;
  for (const w of wanted) {
    const wLower = w.toLowerCase();
    const hit = haystack.some(
      (h) => h.includes(wLower) || wLower.includes(h) || textContainsPhrase([h], wLower)
    );
    if (hit) matched++;
  }
  return matched / wanted.length;
}

function priceScore(vendor: Vendor, requirement: DecisionRequirement, categoryPrices: number[]): number {
  const { budgetMin, budgetMax } = requirement;
  if (budgetMax && budgetMax > 0) {
    const ratio = vendor.startingPrice / budgetMax;
    if (ratio <= 1) {
      const min = budgetMin && budgetMin > 0 ? budgetMin : 0;
      const spread = budgetMax - min || budgetMax;
      const positionInBudget = clamp((vendor.startingPrice - min) / spread, 0, 1);
      return clamp(100 - positionInBudget * 25, 70, 100);
    }
    return clamp(70 - (ratio - 1) * 140, 0, 65);
  }
  // No budget given: score relative to the category's observed price range.
  const sorted = [...categoryPrices].sort((a, b) => a - b);
  const min = sorted[0] ?? vendor.startingPrice;
  const max = sorted[sorted.length - 1] ?? vendor.startingPrice;
  if (max === min) return 80;
  const position = (vendor.startingPrice - min) / (max - min);
  return clamp(100 - position * 55, 40, 100);
}

function featureScore(vendor: Vendor, requirement: DecisionRequirement): number {
  const requiredRatio = matchRatio(requirement.requiredFeatures, vendor.features);
  const preferredRatio = matchRatio(requirement.preferredFeatures, vendor.features);
  const excludedHit = requirement.excludedFeatures.length
    ? matchRatio(requirement.excludedFeatures, vendor.features)
    : -1;

  let score: number;
  if (requiredRatio >= 0 && preferredRatio >= 0) {
    score = requiredRatio * 75 + preferredRatio * 25;
  } else if (requiredRatio >= 0) {
    score = requiredRatio * 100;
  } else if (preferredRatio >= 0) {
    score = 50 + preferredRatio * 50;
  } else {
    score = clamp((vendor.features.length / 10) * 100, 20, 95);
  }

  if (excludedHit && excludedHit > 0) {
    score -= excludedHit * 30;
  }

  return clamp(score, 0, 100);
}

function integrationScore(vendor: Vendor, requirement: DecisionRequirement): number {
  const ratio = matchRatio(requirement.integrationRequirements, vendor.integrations);
  if (ratio >= 0) return clamp(ratio * 100, 0, 100);
  return clamp((vendor.integrations.length / 6) * 100, 15, 100);
}

function securityScore(vendor: Vendor, requirement: DecisionRequirement): number {
  const ratio = matchRatio(requirement.securityRequirements, vendor.securityFeatures);
  if (ratio >= 0) return clamp(ratio * 100, 0, 100);
  return clamp((vendor.securityFeatures.length / 4) * 100, 20, 100);
}

function usabilityScore(vendor: Vendor): number {
  return clamp((vendor.rating / 5) * 100, 0, 100);
}

const SUPPORT_BASE: Record<Vendor["supportLevel"], number> = {
  self_serve: 55,
  business_hours: 72,
  "24_7": 88,
  dedicated_csm: 97,
};

function supportScore(vendor: Vendor): number {
  return SUPPORT_BASE[vendor.supportLevel];
}

function implementationScore(vendor: Vendor, requirement: DecisionRequirement): number {
  let score = clamp(100 - ((vendor.implementationDays - 3) / (90 - 3)) * 100, 5, 100);
  if (requirement.implementationPreference === "self_serve" && vendor.implementationDays <= 10) {
    score = clamp(score + 8, 0, 100);
  }
  if (requirement.implementationPreference === "white_glove" && vendor.supportLevel === "dedicated_csm") {
    score = clamp(score + 8, 0, 100);
  }
  if (requirement.implementationPreference === "guided_onboarding" && vendor.supportLevel !== "self_serve") {
    score = clamp(score + 4, 0, 100);
  }
  return score;
}

/** Maps a free-text criterion name onto one of the fixed scoring dimensions. */
function mapCriterionToDimension(name: string): keyof Omit<VendorScoreBreakdown, "overallScore" | "criteriaContributions" | "evaluatedCapabilities" | "evaluatedCriteria"> {
  const n = name.toLowerCase();
  if (/(price|cost|budget|afford)/.test(n)) return "priceScore";
  if (/(security|compliance|privacy|encrypt)/.test(n)) return "securityScore";
  if (/(support|service|sla|response time)/.test(n)) return "supportScore";
  if (/(implementation|deploy|rollout|time to value|setup)/.test(n)) return "implementationScore";
  if (/(integration|api|connect)/.test(n)) return "integrationScore";
  if (/(ease|usab|adopt|onboard|simplicity|learning curve)/.test(n)) return "usabilityScore";
  if (/(value|roi)/.test(n)) return "valueScore";
  // automation, reporting, functionality, feature, capability, or anything else
  return "featureScore";
}

function keywordEvidenceScore(vendor: Vendor, criterionName: string): number | null {
  const words = tokens(criterionName);
  if (words.length === 0) return null;
  const corpus = [...vendor.features, ...vendor.integrations, ...vendor.securityFeatures].map((s) => s.toLowerCase());
  const hit = corpus.some((c) => words.some((w) => w.length > 3 && c.includes(w)));
  return hit ? 100 : 35;
}

export interface ScoringContext {
  categoryPrices: number[]; // startingPrice values of other vendors in the same category, for relative pricing when no budget given
}

export const ScoringService = {
  computeVendorScore(
    vendor: Vendor,
    requirement: DecisionRequirement,
    criteria: DecisionCriterion[],
    ctx: ScoringContext
  ): VendorScoreBreakdown {
    const priceS = round1(priceScore(vendor, requirement, ctx.categoryPrices));
    const featureS = round1(featureScore(vendor, requirement));
    const integrationS = round1(integrationScore(vendor, requirement));
    const securityS = round1(securityScore(vendor, requirement));
    const usabilityS = round1(usabilityScore(vendor));
    const supportS = round1(supportScore(vendor));
    const implementationS = round1(implementationScore(vendor, requirement));
    const valueS = round1(priceS * 0.5 + featureS * 0.5);

    const dimensionValues: Record<string, number> = {
      priceScore: priceS,
      featureScore: featureS,
      integrationScore: integrationS,
      securityScore: securityS,
      usabilityScore: usabilityS,
      supportScore: supportS,
      implementationScore: implementationS,
      valueScore: valueS,
    };

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 100;
    const contributions = criteria.map((c) => {
      const dimension = mapCriterionToDimension(c.name);
      const dimensionScore = dimensionValues[dimension];
      const evidence = keywordEvidenceScore(vendor, c.name);
      const rawScore = round1(evidence !== null ? dimensionScore * 0.7 + evidence * 0.3 : dimensionScore);
      const normalisedWeight = (c.weight / totalWeight) * 100;
      return {
        criterionId: c.id,
        criterionName: c.name,
        weight: round1(normalisedWeight),
        rawScore,
        weighted: round1((normalisedWeight / 100) * rawScore),
      };
    });

    const overallScore = round1(
      criteria.length > 0
        ? contributions.reduce((sum, c) => sum + c.weighted, 0)
        : (priceS + featureS + integrationS + usabilityS + securityS + supportS + implementationS) / 7
    );

    const evaluatedCapabilities =
      requirement.requiredFeatures.length +
      requirement.preferredFeatures.length +
      requirement.integrationRequirements.length +
      requirement.securityRequirements.length || vendor.features.length + vendor.integrations.length;

    return {
      priceScore: priceS,
      featureScore: featureS,
      integrationScore: integrationS,
      usabilityScore: usabilityS,
      securityScore: securityS,
      supportScore: supportS,
      implementationScore: implementationS,
      valueScore: valueS,
      overallScore: clamp(overallScore, 0, 100),
      criteriaContributions: contributions,
      evaluatedCapabilities,
      evaluatedCriteria: criteria.length,
    };
  },
};
