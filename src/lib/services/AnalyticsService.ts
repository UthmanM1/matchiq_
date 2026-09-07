import { AnalyticsEventType } from "@/types";
import { db, newId, nowIso } from "@/lib/store/db";

export const AnalyticsService = {
  track(organisationId: string, userId: string | undefined, type: AnalyticsEventType, metadata?: Record<string, unknown>) {
    db.analyticsEvents.push({
      id: newId("evt"),
      organisationId,
      userId,
      type,
      metadata,
      createdAt: nowIso(),
    });
  },

  countByType(organisationId?: string) {
    const events = organisationId ? db.analyticsEvents.filter((e) => e.organisationId === organisationId) : db.analyticsEvents;
    const counts: Record<string, number> = {};
    for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;
    return counts;
  },

  recentEvents(organisationId: string, limit = 20) {
    return [...db.analyticsEvents]
      .filter((e) => e.organisationId === organisationId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  },

  decisionAnalytics(organisationId: string) {
    const decisions = db.decisions.filter((d) => d.organisationId === organisationId);
    const completed = decisions.filter((d) => d.status === "decided");
    const avgVendors =
      decisions.length === 0
        ? 0
        : decisions.reduce((sum, d) => sum + db.decisionVendors.filter((dv) => dv.decisionId === d.id).length, 0) / decisions.length;

    const avgDecisionDays =
      completed.length === 0
        ? 0
        : completed.reduce((sum, d) => {
            const days = (new Date(d.decisionDate || d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / 86400000;
            return sum + Math.max(days, 0.5);
          }, 0) / completed.length;

    const categoryCounts: Record<string, number> = {};
    for (const d of decisions) categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;

    const vendorSelections: Record<string, number> = {};
    for (const d of completed) {
      if (d.selectedVendorId) vendorSelections[d.selectedVendorId] = (vendorSelections[d.selectedVendorId] || 0) + 1;
    }
    const mostSelected = Object.entries(vendorSelections)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([vendorId, count]) => ({ vendorId, vendor: db.vendors.find((v) => v.id === vendorId)?.name || vendorId, count }));

    return {
      decisionsCreated: decisions.length,
      decisionsCompleted: completed.length,
      avgVendorsEvaluated: Math.round(avgVendors * 10) / 10,
      avgDecisionDays: Math.round(avgDecisionDays * 10) / 10,
      mostEvaluatedCategories: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6),
      mostSelectedVendors: mostSelected,
    };
  },

  aiUsageSummary(organisationId?: string) {
    const usage = organisationId ? db.aiUsage.filter((u) => u.organisationId === organisationId) : db.aiUsage;
    const successful = usage.filter((u) => u.success);
    return {
      requests: usage.length,
      successful: successful.length,
      failures: usage.length - successful.length,
      estimatedTokens: usage.reduce((s, u) => s + u.estimatedTokens, 0),
      estimatedCostUsd: Math.round(usage.reduce((s, u) => s + u.estimatedCostUsd, 0) * 1000) / 1000,
      avgLatencyMs: usage.length ? Math.round(usage.reduce((s, u) => s + u.latencyMs, 0) / usage.length) : 0,
    };
  },
};
