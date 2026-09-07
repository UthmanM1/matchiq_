import { getSession } from "@/lib/auth";
import { db } from "@/lib/store/db";
import { AnalyticsService } from "@/lib/services/AnalyticsService";
import { VendorService } from "@/lib/services/VendorService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";
import { AdminActivityChart } from "@/components/decision/admin-activity-chart";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) return null;

  const decisions = db.decisions;
  const completed = decisions.filter((d) => d.status === "decided");
  const aiUsage = AnalyticsService.aiUsageSummary();
  const vendors = await VendorService.list();
  const recentEvents = [...db.analyticsEvents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 12);

  const eventCounts = AnalyticsService.countByType();
  const chartData = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ name: type.replaceAll("_", " "), count }));

  return (
    <div>
      <Topbar title="Admin" fullName={session.fullName} subtitle="Cross-organisation operational overview" />
      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <Stat label="Organisations" value={db.organisations.length} />
          <Stat label="Users" value={db.profiles.length} />
          <Stat label="Decisions" value={decisions.length} />
          <Stat label="Completed" value={completed.length} />
          <Stat label="Vendors" value={vendors.length} />
          <Stat label="AI requests" value={aiUsage.requests} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-slate-900 mb-3">AI usage</p>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <Metric label="Successful" value={aiUsage.successful} />
                <Metric label="Failures" value={aiUsage.failures} />
                <Metric label="Estimated tokens" value={aiUsage.estimatedTokens.toLocaleString()} />
                <Metric label="Estimated cost" value={`$${aiUsage.estimatedCostUsd}`} />
                <Metric label="Avg latency" value={`${aiUsage.avgLatencyMs}ms`} />
                <Metric label="Reports generated" value={eventCounts.report_generated || 0} />
              </dl>
            </CardContent>
          </Card>
          <AdminActivityChart data={chartData} />
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">Recent activity (all organisations)</p>
            <div className="divide-y divide-slate-100">
              {recentEvents.map((e) => {
                const org = db.organisations.find((o) => o.id === e.organisationId);
                return (
                  <div key={e.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-700">{e.type.replaceAll("_", " ")} · {org?.name}</span>
                    <span className="text-slate-400">{relativeTime(e.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">Organisations</p>
            <div className="divide-y divide-slate-100">
              {db.organisations.map((o) => {
                const orgDecisions = decisions.filter((d) => d.organisationId === o.id);
                const orgUsers = db.profiles.filter((p) => p.organisationId === o.id);
                return (
                  <div key={o.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-700">{o.name}</span>
                    <span className="text-slate-400">{orgUsers.length} users · {orgDecisions.length} decisions</span>
                  </div>
                );
              })}
            </div>
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
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
