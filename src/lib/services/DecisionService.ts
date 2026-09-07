import { Decision, DecisionStatus, DecisionVendor } from "@/types";
import { db, newId, nowIso } from "@/lib/store/db";
import { AnalyticsService } from "./AnalyticsService";
import { CriteriaService } from "./CriteriaService";
import { VendorService } from "./VendorService";
import { ScoringService } from "./ScoringService";
import { RequirementService } from "./RequirementService";

export const DecisionService = {
  create(organisationId: string, ownerId: string, ownerName: string, name: string, category: string): Decision {
    const decision: Decision = {
      id: newId("dec"),
      organisationId,
      name,
      category,
      status: "draft",
      ownerId,
      ownerName,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.decisions.push(decision);
    db.members.push({ id: newId("mem"), decisionId: decision.id, userId: ownerId, userName: ownerName, role: "owner", addedAt: nowIso() });
    CriteriaService.seedDefaults(decision.id, organisationId, ownerId);
    AnalyticsService.track(organisationId, ownerId, "decision_created", { decisionId: decision.id, category });
    return decision;
  },

  get(id: string): Decision | undefined {
    return db.decisions.find((d) => d.id === id);
  },

  listForOrg(organisationId: string): Decision[] {
    return db.decisions
      .filter((d) => d.organisationId === organisationId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },

  setStatus(id: string, status: DecisionStatus) {
    const decision = db.decisions.find((d) => d.id === id);
    if (!decision) return undefined;
    decision.status = status;
    decision.updatedAt = nowIso();
    return decision;
  },

  async addToShortlist(decisionId: string, organisationId: string, userId: string, vendorId: string) {
    const existing = db.decisionVendors.find((dv) => dv.decisionId === decisionId && dv.vendorId === vendorId);
    if (existing) {
      existing.shortlisted = true;
    } else {
      db.decisionVendors.push({ id: newId("dv"), decisionId, vendorId, shortlisted: true, addedAt: nowIso() });
    }
    const decision = db.decisions.find((d) => d.id === decisionId);
    if (decision && decision.status === "draft") decision.status = "researching";
    if (decision) decision.updatedAt = nowIso();
    AnalyticsService.track(organisationId, userId, "vendor_shortlisted", { decisionId, vendorId });
    await DecisionService.rescoreAll(decisionId);
    return DecisionService.getShortlist(decisionId);
  },

  removeFromShortlist(decisionId: string, vendorId: string) {
    db.decisionVendors = db.decisionVendors.filter((dv) => !(dv.decisionId === decisionId && dv.vendorId === vendorId));
    return DecisionService.getShortlist(decisionId);
  },

  rank(decisionId: string, vendorId: string, rank: number) {
    const dv = db.decisionVendors.find((d) => d.decisionId === decisionId && d.vendorId === vendorId);
    if (dv) dv.rank = rank;
    return DecisionService.getShortlist(decisionId);
  },

  getShortlist(decisionId: string): DecisionVendor[] {
    return db.decisionVendors.filter((dv) => dv.decisionId === decisionId && dv.shortlisted);
  },

  /** Recomputes deterministic scores for every shortlisted vendor in a decision. */
  async rescoreAll(decisionId: string) {
    const requirement = RequirementService.getByDecision(decisionId);
    const criteria = CriteriaService.list(decisionId);
    const shortlist = db.decisionVendors.filter((dv) => dv.decisionId === decisionId);
    if (!requirement || shortlist.length === 0) return;

    const category = requirement.category;
    const categoryVendors = await VendorService.byCategory(category as never).catch(() => []);
    const categoryPrices = categoryVendors.length ? categoryVendors.map((v) => v.startingPrice) : [];

    for (const dv of shortlist) {
      const vendor = await VendorService.get(dv.vendorId);
      if (!vendor) continue;
      dv.score = ScoringService.computeVendorScore(vendor, requirement, criteria, {
        categoryPrices: categoryPrices.length ? categoryPrices : [vendor.startingPrice],
      });
    }
  },

  async finalise(decisionId: string, organisationId: string, userId: string, selectedVendorId: string, rationale: string) {
    const decision = db.decisions.find((d) => d.id === decisionId);
    if (!decision) return undefined;
    decision.selectedVendorId = selectedVendorId;
    decision.rationale = rationale;
    decision.decisionDate = nowIso();
    decision.status = "decided";
    decision.updatedAt = nowIso();
    AnalyticsService.track(organisationId, userId, "decision_completed", { decisionId, selectedVendorId });
    return decision;
  },
};
