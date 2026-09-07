import { describe, it, expect } from "vitest";
import { CollaborationService } from "@/lib/services/CollaborationService";
import { AnalyticsService } from "@/lib/services/AnalyticsService";
import { DecisionService } from "@/lib/services/DecisionService";
import { VendorService } from "@/lib/services/VendorService";

const ORG = "org_test_collab";
const USER_1 = "user_test_collab_1";
const USER_2 = "user_test_collab_2";

describe("CollaborationService — voting", () => {
  it("aggregates votes by value for a vendor", async () => {
    const decision = DecisionService.create(ORG, USER_1, "User One", "Voting Test", "CRM");
    const vendors = await VendorService.byCategory("CRM");
    const vendorId = vendors[0].id;

    CollaborationService.vote(decision.id, ORG, vendorId, USER_1, "User One", "strong_choice");
    CollaborationService.vote(decision.id, ORG, vendorId, USER_2, "User Two", "acceptable");

    const summary = CollaborationService.voteSummary(decision.id, vendorId);
    expect(summary.strong_choice).toBe(1);
    expect(summary.acceptable).toBe(1);
    expect(summary.not_suitable).toBe(0);
    expect(summary.total).toBe(2);
  });

  it("changing an existing vote replaces it rather than adding a second one", async () => {
    const decision = DecisionService.create(ORG, USER_1, "User One", "Vote Change Test", "CRM");
    const vendors = await VendorService.byCategory("CRM");
    const vendorId = vendors[0].id;

    CollaborationService.vote(decision.id, ORG, vendorId, USER_1, "User One", "acceptable");
    CollaborationService.vote(decision.id, ORG, vendorId, USER_1, "User One", "strong_choice");

    const summary = CollaborationService.voteSummary(decision.id, vendorId);
    expect(summary.total).toBe(1);
    expect(summary.strong_choice).toBe(1);
  });
});

describe("CollaborationService — comments & mentions", () => {
  it("extracts @mentions from a comment body", async () => {
    const decision = DecisionService.create(ORG, USER_1, "User One", "Mentions Test", "CRM");
    const comment = CollaborationService.addComment(decision.id, ORG, USER_1, "User One", "Worth a look @Priya Chandran before we shortlist further.");
    expect(comment.mentions).toContain("Priya Chandran");
  });
});

describe("AnalyticsService — event tracking", () => {
  it("records an event and counts it by type", () => {
    const org = "org_test_analytics";
    AnalyticsService.track(org, USER_1, "vendor_viewed", { vendorId: "v001" });
    AnalyticsService.track(org, USER_1, "vendor_viewed", { vendorId: "v002" });
    AnalyticsService.track(org, USER_1, "comparison_started", {});

    const counts = AnalyticsService.countByType(org);
    expect(counts.vendor_viewed).toBe(2);
    expect(counts.comparison_started).toBe(1);
  });

  it("tracking a decision through its lifecycle produces the expected event trail", async () => {
    const org = "org_test_analytics_lifecycle";
    const decision = DecisionService.create(org, USER_1, "User One", "Lifecycle Analytics Test", "CRM");
    const vendors = await VendorService.byCategory("CRM");
    await DecisionService.addToShortlist(decision.id, org, USER_1, vendors[0].id);

    const counts = AnalyticsService.countByType(org);
    expect(counts.decision_created).toBeGreaterThanOrEqual(1);
    expect(counts.criteria_created).toBeGreaterThanOrEqual(1);
    expect(counts.vendor_shortlisted).toBeGreaterThanOrEqual(1);
  });
});
