import { db, newId, nowIso } from "@/lib/store/db";
import { DecisionService } from "./DecisionService";
import { RequirementService } from "./RequirementService";
import { CriteriaService } from "./CriteriaService";
import { VendorService } from "./VendorService";
import { CollaborationService } from "./CollaborationService";
import { AnalyticsService } from "./AnalyticsService";
import { AIService } from "./AIService";

export const ReportService = {
  async generate(decisionId: string, organisationId: string, userId: string, userName: string) {
    const decision = DecisionService.get(decisionId);
    const requirement = RequirementService.getByDecision(decisionId);
    if (!decision || !requirement) throw new Error("Decision or requirement not found");

    const criteria = CriteriaService.list(decisionId);
    const shortlist = DecisionService.getShortlist(decisionId);
    await DecisionService.rescoreAll(decisionId);

    const vendorRows = [];
    for (const dv of shortlist) {
      const vendor = await VendorService.get(dv.vendorId);
      if (!vendor || !dv.score) continue;
      const explanation = await AIService.explainRecommendation(vendor, requirement, criteria, dv.score);
      vendorRows.push({ vendor, score: dv.score, explanation, notes: CollaborationService.listNotes(decisionId, vendor.id), votes: CollaborationService.voteSummary(decisionId, vendor.id) });
    }
    vendorRows.sort((a, b) => b.score.overallScore - a.score.overallScore);

    const selectedVendor = decision.selectedVendorId ? await VendorService.get(decision.selectedVendorId) : undefined;

    const snapshot = {
      decision: { id: decision.id, name: decision.name, status: decision.status, category: decision.category, owner: decision.ownerName },
      requirement,
      criteria,
      vendorRows: vendorRows.map((r) => ({
        vendorId: r.vendor.id,
        name: r.vendor.name,
        category: r.vendor.category,
        startingPrice: r.vendor.startingPrice,
        currency: r.vendor.currency,
        overallScore: r.score.overallScore,
        breakdown: r.score,
        explanation: r.explanation,
        votes: r.votes,
      })),
      selectedVendor: selectedVendor ? { id: selectedVendor.id, name: selectedVendor.name } : undefined,
      rationale: decision.rationale,
      decisionDate: decision.decisionDate,
      generatedAt: nowIso(),
    };

    const report = { id: newId("rpt"), decisionId, generatedAt: nowIso(), generatedBy: userName, snapshot };
    db.reports.push(report);
    AnalyticsService.track(organisationId, userId, "report_generated", { decisionId });
    return report;
  },

  latest(decisionId: string) {
    return [...db.reports].filter((r) => r.decisionId === decisionId).sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1))[0];
  },

  list(decisionId: string) {
    return db.reports.filter((r) => r.decisionId === decisionId);
  },
};
