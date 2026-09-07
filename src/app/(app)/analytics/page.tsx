import { getSession } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/AnalyticsService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsCharts } from "@/components/decision/analytics-charts";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) return null;
  const analytics = AnalyticsService.decisionAnalytics(session.organisationId);

  return (
    <div>
      <Topbar title="Analytics" fullName={session.fullName} subtitle="How your organisation makes software decisions" />
      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Decisions created" value={analytics.decisionsCreated} />
          <Stat label="Decisions completed" value={analytics.decisionsCompleted} />
          <Stat label="Avg vendors evaluated" value={analytics.avgVendorsEvaluated} />
          <Stat label="Avg decision time (days)" value={analytics.avgDecisionDays} />
        </div>

        <AnalyticsCharts categories={analytics.mostEvaluatedCategories} vendors={analytics.mostSelectedVendors} />

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">Most selected vendors</p>
            {analytics.mostSelectedVendors.length === 0 ? (
              <p className="text-xs text-slate-400">No decisions finalised yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {analytics.mostSelectedVendors.map((v) => (
                  <li key={v.vendorId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{v.vendor}</span>
                    <span className="text-slate-400 text-xs">{v.count} selection{v.count === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
