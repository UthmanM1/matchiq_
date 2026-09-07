import { describe, it, expect } from "vitest";
import { ScoringService } from "@/lib/services/ScoringService";
import { DecisionCriterion, DecisionRequirement, Vendor } from "@/types";

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: "v_test",
    name: "TestCRM",
    category: "CRM",
    description: "A test vendor",
    pricingModel: "flat",
    startingPrice: 100,
    currency: "GBP",
    rating: 4.5,
    reviewCount: 200,
    companySize: "11-50",
    features: ["Pipeline management", "Email automation", "Reporting", "Slack integration"],
    integrations: ["Slack", "Gmail"],
    securityFeatures: ["SSO", "2FA"],
    implementationTime: "1-3 weeks",
    implementationDays: 14,
    supportLevel: "business_hours",
    deploymentType: "cloud",
    website: "https://example.com",
    logo: "TC",
    isDemoData: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRequirement(overrides: Partial<DecisionRequirement> = {}): DecisionRequirement {
  return {
    id: "req_test",
    decisionId: "dec_test",
    rawInput: "test",
    category: "CRM",
    currency: "GBP",
    billingFrequency: "monthly",
    requiredFeatures: [],
    preferredFeatures: [],
    excludedFeatures: [],
    priorities: [],
    constraints: [],
    integrationRequirements: [],
    securityRequirements: [],
    implementationPreference: "guided_onboarding",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const DEFAULT_CRITERIA: DecisionCriterion[] = [
  { id: "c1", decisionId: "dec_test", name: "Price", weight: 20, importance: "important", order: 0 },
  { id: "c2", decisionId: "dec_test", name: "Automation", weight: 25, importance: "important", order: 1 },
  { id: "c3", decisionId: "dec_test", name: "Ease of use", weight: 20, importance: "important", order: 2 },
  { id: "c4", decisionId: "dec_test", name: "Integrations", weight: 15, importance: "important", order: 3 },
  { id: "c5", decisionId: "dec_test", name: "Reporting", weight: 20, importance: "optional", order: 4 },
];

describe("ScoringService", () => {
  it("is deterministic: identical inputs always produce identical scores", () => {
    const vendor = makeVendor();
    const requirement = makeRequirement({ requiredFeatures: ["pipeline management"], budgetMax: 500 });
    const scoreA = ScoringService.computeVendorScore(vendor, requirement, DEFAULT_CRITERIA, { categoryPrices: [80, 100, 150] });
    const scoreB = ScoringService.computeVendorScore(vendor, requirement, DEFAULT_CRITERIA, { categoryPrices: [80, 100, 150] });
    expect(scoreA).toEqual(scoreB);
  });

  it("never involves randomness across repeated calls in the same process", () => {
    const vendor = makeVendor();
    const requirement = makeRequirement();
    const scores = Array.from({ length: 5 }, () =>
      ScoringService.computeVendorScore(vendor, requirement, DEFAULT_CRITERIA, { categoryPrices: [100] }).overallScore
    );
    expect(new Set(scores).size).toBe(1);
  });

  it("scores required-feature matches higher than a vendor missing them", () => {
    const requirement = makeRequirement({ requiredFeatures: ["pipeline management", "email automation", "reporting", "slack integration"] });
    const fullMatch = makeVendor({ id: "v_full" });
    const noMatch = makeVendor({ id: "v_none", features: ["Unrelated feature A", "Unrelated feature B"] });

    const fullScore = ScoringService.computeVendorScore(fullMatch, requirement, DEFAULT_CRITERIA, { categoryPrices: [100] });
    const noScore = ScoringService.computeVendorScore(noMatch, requirement, DEFAULT_CRITERIA, { categoryPrices: [100] });

    expect(fullScore.featureScore).toBeGreaterThan(noScore.featureScore);
    expect(fullScore.overallScore).toBeGreaterThan(noScore.overallScore);
  });

  it("penalises a vendor priced above the stated budget", () => {
    const requirement = makeRequirement({ budgetMin: 100, budgetMax: 200 });
    const withinBudget = makeVendor({ id: "v_cheap", startingPrice: 150 });
    const overBudget = makeVendor({ id: "v_pricey", startingPrice: 800 });

    const cheapScore = ScoringService.computeVendorScore(withinBudget, requirement, DEFAULT_CRITERIA, { categoryPrices: [150, 800] });
    const pricyScore = ScoringService.computeVendorScore(overBudget, requirement, DEFAULT_CRITERIA, { categoryPrices: [150, 800] });

    expect(cheapScore.priceScore).toBeGreaterThan(pricyScore.priceScore);
  });

  it("falls back to category-relative pricing when no budget is given", () => {
    const requirement = makeRequirement({ budgetMin: undefined, budgetMax: undefined });
    const cheapest = makeVendor({ id: "v_cheapest", startingPrice: 10 });
    const priciest = makeVendor({ id: "v_priciest", startingPrice: 500 });
    const categoryPrices = [10, 100, 250, 500];

    const cheapScore = ScoringService.computeVendorScore(cheapest, requirement, DEFAULT_CRITERIA, { categoryPrices });
    const priceyScore = ScoringService.computeVendorScore(priciest, requirement, DEFAULT_CRITERIA, { categoryPrices });

    expect(cheapScore.priceScore).toBeGreaterThan(priceyScore.priceScore);
  });

  it("produces a reproducible ranking across a shortlist", () => {
    const requirement = makeRequirement({ requiredFeatures: ["pipeline management", "reporting"], budgetMax: 300 });
    const vendors = [
      makeVendor({ id: "v1", startingPrice: 120, rating: 4.8 }),
      makeVendor({ id: "v2", startingPrice: 90, rating: 3.9, features: ["Pipeline management"] }),
      makeVendor({ id: "v3", startingPrice: 400, rating: 4.9 }),
    ];
    const categoryPrices = vendors.map((v) => v.startingPrice);

    const rank = () =>
      vendors
        .map((v) => ({ id: v.id, score: ScoringService.computeVendorScore(v, requirement, DEFAULT_CRITERIA, { categoryPrices }).overallScore }))
        .sort((a, b) => b.score - a.score)
        .map((r) => r.id);

    expect(rank()).toEqual(rank());
  });

  it("weights contributions so they sum to the overall score", () => {
    const vendor = makeVendor();
    const requirement = makeRequirement({ requiredFeatures: ["pipeline management"] });
    const score = ScoringService.computeVendorScore(vendor, requirement, DEFAULT_CRITERIA, { categoryPrices: [100] });
    const summed = score.criteriaContributions.reduce((s, c) => s + c.weighted, 0);
    expect(Math.abs(summed - score.overallScore)).toBeLessThan(0.2);
  });

  it("reports evaluated capabilities and criteria counts for the evidence note", () => {
    const vendor = makeVendor();
    const requirement = makeRequirement({ requiredFeatures: ["a", "b"], integrationRequirements: ["Slack"] });
    const score = ScoringService.computeVendorScore(vendor, requirement, DEFAULT_CRITERIA, { categoryPrices: [100] });
    expect(score.evaluatedCriteria).toBe(DEFAULT_CRITERIA.length);
    expect(score.evaluatedCapabilities).toBeGreaterThan(0);
  });
});
