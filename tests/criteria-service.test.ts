import { describe, it, expect } from "vitest";
import { CriteriaService } from "@/lib/services/CriteriaService";
import { DecisionService } from "@/lib/services/DecisionService";

const ORG = "org_test_criteria";
const USER = "user_test_criteria";

describe("CriteriaService", () => {
  it("seeds five default criteria whose weights sum to 100", () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Criteria Seed Test", "CRM");
    const criteria = CriteriaService.list(decision.id);
    expect(criteria).toHaveLength(5);
    const total = criteria.reduce((s, c) => s + c.weight, 0);
    expect(Math.round(total)).toBe(100);
  });

  it("re-normalises all weights to sum to 100 after adding a criterion", () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Criteria Add Test", "CRM");
    CriteriaService.add(decision.id, ORG, USER, "Data residency", 20, "important");
    const criteria = CriteriaService.list(decision.id);
    const total = criteria.reduce((s, c) => s + c.weight, 0);
    expect(Math.round(total)).toBe(100);
    expect(criteria.some((c) => c.name === "Data residency")).toBe(true);
  });

  it("re-normalises remaining weights to 100 after removing a criterion", () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Criteria Remove Test", "CRM");
    const before = CriteriaService.list(decision.id);
    const toRemove = before[0];
    CriteriaService.remove(decision.id, toRemove.id);
    const after = CriteriaService.list(decision.id);
    expect(after).toHaveLength(before.length - 1);
    const total = after.reduce((s, c) => s + c.weight, 0);
    expect(Math.round(total)).toBe(100);
  });

  it("re-normalises after a manual weight change", () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Criteria Weight Test", "CRM");
    const criteria = CriteriaService.list(decision.id);
    CriteriaService.updateWeight(decision.id, ORG, USER, criteria[0].id, 90);
    const after = CriteriaService.list(decision.id);
    const total = after.reduce((s, c) => s + c.weight, 0);
    expect(Math.round(total)).toBe(100);
    // the criterion we boosted should now hold the largest share
    const boosted = after.find((c) => c.id === criteria[0].id)!;
    expect(boosted.weight).toBeGreaterThan(after.find((c) => c.id !== criteria[0].id)!.weight);
  });

  it("updates importance independently of weight", () => {
    const decision = DecisionService.create(ORG, USER, "Test User", "Importance Test", "CRM");
    const criteria = CriteriaService.list(decision.id);
    CriteriaService.updateImportance(decision.id, criteria[0].id, "required");
    const after = CriteriaService.list(decision.id);
    expect(after.find((c) => c.id === criteria[0].id)!.importance).toBe("required");
  });
});
