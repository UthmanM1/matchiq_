import { describe, it, expect } from "vitest";
import { DecisionService } from "@/lib/services/DecisionService";
import { RequirementService } from "@/lib/services/RequirementService";
import { VendorService } from "@/lib/services/VendorService";

const ORG_A = "org_test_alpha";
const ORG_B = "org_test_beta";
const USER_A = "user_test_alpha";
const USER_B = "user_test_beta";

describe("DecisionService — organisation access isolation", () => {
  it("only returns decisions that belong to the requesting organisation", () => {
    const decisionA = DecisionService.create(ORG_A, USER_A, "Alpha User", "Alpha CRM Decision", "CRM");
    const decisionB = DecisionService.create(ORG_B, USER_B, "Beta User", "Beta CRM Decision", "CRM");

    const orgAList = DecisionService.listForOrg(ORG_A);
    const orgBList = DecisionService.listForOrg(ORG_B);

    expect(orgAList.some((d) => d.id === decisionA.id)).toBe(true);
    expect(orgAList.some((d) => d.id === decisionB.id)).toBe(false);
    expect(orgBList.some((d) => d.id === decisionB.id)).toBe(true);
    expect(orgBList.some((d) => d.id === decisionA.id)).toBe(false);
  });

  it("a decision record carries the organisation id needed for a page-level access check", () => {
    const decision = DecisionService.create(ORG_A, USER_A, "Alpha User", "Access Check Decision", "CRM");
    // This mirrors the guard used in every /decisions/[id] and /workspace/[id]
    // page: `if (decision.organisationId !== session.organisationId) notFound()`.
    expect(decision.organisationId).toBe(ORG_A);
    expect(decision.organisationId).not.toBe(ORG_B);
  });
});

describe("DecisionService — status lifecycle", () => {
  it("starts in draft and moves to researching once a vendor is shortlisted", async () => {
    const decision = DecisionService.create(ORG_A, USER_A, "Alpha User", "Lifecycle Test", "CRM");
    expect(decision.status).toBe("draft");

    const vendors = await VendorService.byCategory("CRM");
    await DecisionService.addToShortlist(decision.id, ORG_A, USER_A, vendors[0].id);

    const refreshed = DecisionService.get(decision.id)!;
    expect(refreshed.status).toBe("researching");
  });

  it("finalise() marks the decision decided and stores the rationale", async () => {
    const decision = DecisionService.create(ORG_A, USER_A, "Alpha User", "Finalise Test", "CRM");
    const vendors = await VendorService.byCategory("CRM");
    await DecisionService.addToShortlist(decision.id, ORG_A, USER_A, vendors[0].id);

    await DecisionService.finalise(decision.id, ORG_A, USER_A, vendors[0].id, "Best fit for budget and features.");
    const finalised = DecisionService.get(decision.id)!;

    expect(finalised.status).toBe("decided");
    expect(finalised.selectedVendorId).toBe(vendors[0].id);
    expect(finalised.rationale).toContain("Best fit");
  });
});

describe("DecisionService — shortlist & scoring", () => {
  it("computes and stores a score for every shortlisted vendor after rescoreAll", async () => {
    const decision = DecisionService.create(ORG_A, USER_A, "Alpha User", "Scoring Test", "CRM");
    await RequirementService.submitRawInput(
      decision.id,
      ORG_A,
      USER_A,
      "We are a 30-person marketing agency looking for CRM software. We need pipeline management, automated email workflows, reporting, Slack integration and strong onboarding. Our budget is around £500 per month."
    );

    const vendors = await VendorService.byCategory("CRM");
    await DecisionService.addToShortlist(decision.id, ORG_A, USER_A, vendors[0].id);
    await DecisionService.addToShortlist(decision.id, ORG_A, USER_A, vendors[1].id);

    const shortlist = DecisionService.getShortlist(decision.id);
    expect(shortlist).toHaveLength(2);
    for (const dv of shortlist) {
      expect(dv.score).toBeDefined();
      expect(dv.score!.overallScore).toBeGreaterThanOrEqual(0);
      expect(dv.score!.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it("removing a vendor takes it out of the shortlist", async () => {
    const decision = DecisionService.create(ORG_A, USER_A, "Alpha User", "Remove Test", "CRM");
    const vendors = await VendorService.byCategory("CRM");
    await DecisionService.addToShortlist(decision.id, ORG_A, USER_A, vendors[0].id);
    expect(DecisionService.getShortlist(decision.id)).toHaveLength(1);

    DecisionService.removeFromShortlist(decision.id, vendors[0].id);
    expect(DecisionService.getShortlist(decision.id)).toHaveLength(0);
  });
});
