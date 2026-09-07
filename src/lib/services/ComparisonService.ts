import { DecisionVendor, Vendor } from "@/types";
import { db, nowIso, newId } from "@/lib/store/db";
import { VendorService } from "./VendorService";
import { AnalyticsService } from "./AnalyticsService";

export interface ComparisonRow {
  vendor: Vendor;
  decisionVendor?: DecisionVendor;
}

export const ComparisonService = {
  async buildComparison(vendorIds: string[]): Promise<ComparisonRow[]> {
    const rows: ComparisonRow[] = [];
    for (const id of vendorIds.slice(0, 5)) {
      const vendor = await VendorService.get(id);
      if (vendor) rows.push({ vendor });
    }
    return rows;
  },

  attachDecisionContext(rows: ComparisonRow[], decisionId: string): ComparisonRow[] {
    return rows.map((r) => ({
      ...r,
      decisionVendor: db.decisionVendors.find((dv) => dv.decisionId === decisionId && dv.vendorId === r.vendor.id),
    }));
  },

  highlights(rows: ComparisonRow[]) {
    if (rows.length === 0) return undefined;
    const withScore = rows.filter((r) => r.decisionVendor?.score);
    const bestMatch = withScore.length
      ? withScore.reduce((a, b) => ((a.decisionVendor!.score!.overallScore >= b.decisionVendor!.score!.overallScore) ? a : b))
      : undefined;
    const bestValue = rows.reduce((a, b) => (a.vendor.startingPrice / (a.vendor.rating || 1) <= b.vendor.startingPrice / (b.vendor.rating || 1) ? a : b));
    const lowestCost = rows.reduce((a, b) => (a.vendor.startingPrice <= b.vendor.startingPrice ? a : b));
    const fastestImplementation = rows.reduce((a, b) => (a.vendor.implementationDays <= b.vendor.implementationDays ? a : b));
    return {
      bestMatch: bestMatch?.vendor.id,
      bestValue: bestValue.vendor.id,
      lowestCost: lowestCost.vendor.id,
      fastestImplementation: fastestImplementation.vendor.id,
    };
  },

  logStart(organisationId: string, userId: string, vendorIds: string[]) {
    db.analyticsEvents.push({ id: newId("evt"), organisationId, userId, type: "comparison_started", metadata: { vendorIds }, createdAt: nowIso() });
  },

  logComplete(organisationId: string, userId: string, vendorIds: string[]) {
    AnalyticsService.track(organisationId, userId, "comparison_completed", { vendorIds });
  },
};
