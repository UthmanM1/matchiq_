import { DecisionRequirement } from "@/types";
import { AIService, RequirementExtraction } from "./AIService";
import { db, newId, nowIso } from "@/lib/store/db";
import { AnalyticsService } from "./AnalyticsService";

export const RequirementService = {
  async submitRawInput(decisionId: string, organisationId: string, userId: string, rawInput: string) {
    AnalyticsService.track(organisationId, userId, "requirement_submitted", { decisionId });
    AnalyticsService.track(organisationId, userId, "ai_request_started", { operation: "requirement_extraction" });

    const started = Date.now();
    const extraction: RequirementExtraction = await AIService.extractRequirement(rawInput);
    const latencyMs = Date.now() - started;

    db.aiUsage.push({
      id: newId("aiu"),
      organisationId,
      provider: extraction.source === "openai" ? "openai" : "demo-fallback",
      operation: "requirement_extraction",
      success: true,
      estimatedTokens: Math.round(rawInput.length / 3.5) + 250,
      estimatedCostUsd: extraction.source === "openai" ? 0.004 : 0,
      latencyMs,
      createdAt: nowIso(),
    });
    AnalyticsService.track(organisationId, userId, "ai_request_completed", { operation: "requirement_extraction", source: extraction.source });

    const requirement: DecisionRequirement = {
      id: newId("req"),
      decisionId,
      rawInput,
      category: extraction.category,
      companySize: extraction.companySize,
      budgetMin: extraction.budgetMin,
      budgetMax: extraction.budgetMax,
      currency: "GBP",
      billingFrequency: extraction.billingFrequency,
      requiredFeatures: extraction.requiredFeatures,
      preferredFeatures: extraction.preferredFeatures,
      excludedFeatures: [],
      priorities: extraction.priorities,
      constraints: [],
      integrationRequirements: extraction.integrationRequirements,
      securityRequirements: [],
      implementationPreference: "guided_onboarding",
      extra: { extractionConfidence: extraction.confidence, extractionSource: extraction.source },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.requirements.push(requirement);
    AnalyticsService.track(organisationId, userId, "requirement_extracted", { decisionId, category: requirement.category });

    AnalyticsService.track(organisationId, userId, "clarification_started", { decisionId });
    const questions = await AIService.generateClarificationQuestions(extraction);
    for (const q of questions) {
      db.clarificationQuestions.push({ id: q.id, decisionId, question: q.question, options: q.options, rationale: q.rationale, order: q.order });
    }

    return { requirement, questions: db.clarificationQuestions.filter((q) => q.decisionId === decisionId) };
  },

  getByDecision(decisionId: string): DecisionRequirement | undefined {
    return db.requirements.find((r) => r.decisionId === decisionId);
  },

  update(decisionId: string, patch: Partial<DecisionRequirement>) {
    const req = db.requirements.find((r) => r.decisionId === decisionId);
    if (!req) return undefined;
    Object.assign(req, patch, { updatedAt: nowIso() });
    return req;
  },

  recordAnswer(decisionId: string, organisationId: string, userId: string, questionId: string, answer: string) {
    db.clarificationAnswers.push({ id: newId("ca"), decisionId, questionId, answer, createdAt: nowIso() });
    AnalyticsService.track(organisationId, userId, "clarification_answered", { decisionId, questionId, answer });

    // Fold the answer back into the requirement so it actually changes scoring.
    const req = db.requirements.find((r) => r.decisionId === decisionId);
    const question = db.clarificationQuestions.find((q) => q.id === questionId);
    if (!req || !question) return;

    if (/budget/i.test(question.question)) {
      const ranges: Record<string, [number, number]> = {
        "Under £200": [80, 200],
        "£200-£500": [200, 500],
        "£500-£1,500": [500, 1500],
        "£1,500+": [1500, 4000],
      };
      const range = ranges[answer];
      if (range) {
        req.budgetMin = range[0];
        req.budgetMax = range[1];
      }
    } else if (/implementation/i.test(question.question)) {
      req.implementationPreference = answer === "Essential" ? "self_serve" : answer === "Nice to have" ? "white_glove" : "guided_onboarding";
    } else if (/matters more/i.test(question.question)) {
      req.extra = { ...req.extra, costVsFunctionality: answer };
    } else if (/automation/i.test(question.question)) {
      if (answer === "Essential" && !req.requiredFeatures.includes("automation")) req.requiredFeatures.push("automation");
      else if (!req.preferredFeatures.includes("automation")) req.preferredFeatures.push("automation");
    } else if (/integrate/i.test(question.question) && answer !== "None critical") {
      const tools = answer.split("/").map((t) => t.trim());
      req.integrationRequirements = Array.from(new Set([...req.integrationRequirements, ...tools]));
    }
    req.updatedAt = nowIso();
  },

  getQuestions(decisionId: string) {
    return db.clarificationQuestions.filter((q) => q.decisionId === decisionId).sort((a, b) => a.order - b.order);
  },

  getAnswers(decisionId: string) {
    return db.clarificationAnswers.filter((a) => a.decisionId === decisionId);
  },
};
