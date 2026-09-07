import { describe, it, expect } from "vitest";
import { RequirementService } from "@/lib/services/RequirementService";
import { DecisionService } from "@/lib/services/DecisionService";

const ORG = "org_test_requirement";
const USER = "user_test_requirement";

describe("RequirementService — deterministic extraction (demo fallback)", () => {
  it("extracts category, company size, budget and required features from free text", async () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Extraction Test", "CRM");
    const { requirement, questions } = await RequirementService.submitRawInput(
      decision.id,
      ORG,
      USER,
      "We are a 30-person marketing agency looking for CRM software. We need pipeline management, automated email workflows, reporting, Slack integration and strong onboarding. Our budget is around £500 per month."
    );

    expect(requirement.category).toBe("CRM");
    expect(requirement.companySize).toBe(30);
    expect(requirement.budgetMax).toBe(500);
    expect(requirement.requiredFeatures).toEqual(
      expect.arrayContaining(["pipeline management", "reporting", "slack integration", "email automation"])
    );
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(5);
  });

  it("detects a different category from different keywords", async () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Category Test", "Accounting");
    const { requirement } = await RequirementService.submitRawInput(
      decision.id,
      ORG,
      USER,
      "60-person consultancy replacing our accounting software. Need multi-currency invoicing and bank reconciliation."
    );
    expect(requirement.category).toBe("Accounting");
  });

  it("asks a budget clarification question only when budget wasn't stated", async () => {
    const withBudget = DecisionService.create(ORG, USER, "Test User", "Has Budget", "CRM");
    const { questions: q1 } = await RequirementService.submitRawInput(withBudget.id, ORG, USER, "We need CRM software, budget is £500 per month.");
    expect(q1.some((q) => /budget/i.test(q.question))).toBe(false);

    const withoutBudget = DecisionService.create(ORG, USER, "Test User", "No Budget", "CRM");
    const { questions: q2 } = await RequirementService.submitRawInput(withoutBudget.id, ORG, USER, "We need CRM software for our sales team.");
    expect(q2.some((q) => /budget/i.test(q.question))).toBe(true);
  });

  it("folds a budget clarification answer back into the stored requirement", async () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Clarify Budget Test", "CRM");
    const { questions } = await RequirementService.submitRawInput(decision.id, ORG, USER, "We need CRM software for our sales team.");
    const budgetQuestion = questions.find((q) => /budget/i.test(q.question))!;
    expect(budgetQuestion).toBeDefined();

    RequirementService.recordAnswer(decision.id, ORG, USER, budgetQuestion.id, "£200-£500");
    const updated = RequirementService.getByDecision(decision.id)!;
    expect(updated.budgetMin).toBe(200);
    expect(updated.budgetMax).toBe(500);
  });

  it("folds an implementation-preference answer back into the requirement", async () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Clarify Implementation Test", "CRM");
    const { questions } = await RequirementService.submitRawInput(decision.id, ORG, USER, "We need CRM software for our sales team.");
    const implQuestion = questions.find((q) => /implementation/i.test(q.question))!;

    RequirementService.recordAnswer(decision.id, ORG, USER, implQuestion.id, "Essential");
    const updated = RequirementService.getByDecision(decision.id)!;
    expect(updated.implementationPreference).toBe("self_serve");
  });
});
