import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { AnalyticsService } from "@/lib/services/AnalyticsService";
import { db } from "@/lib/store/db";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";
import { StatusBadge } from "@/components/decision/status-badge";
import { Plus, Inbox } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const decisions = DecisionService.listForOrg(session.organisationId);
  const active = decisions.filter((d) => !["decided", "draft"].includes(d.status));
  const drafts = decisions.filter((d) => d.status === "draft");
  const completed = decisions.filter((d) => d.status === "decided");
  const recent = AnalyticsService.recentEvents(session.organisationId, 8);

  const shortlistedVendorIds = new Set(db.decisionVendors.filter((dv) => dv.shortlisted && decisions.some((d) => d.id === dv.decisionId)).map((dv) => dv.vendorId));

  return (
    <div>
      <Topbar title="Dashboard" fullName={session.fullName} subtitle={`Welcome back, ${session.fullName.split(" ")[0]}`} />
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <StatCard label="Active decisions" value={active.length} />
            <StatCard label="Draft decisions" value={drafts.length} />
            <StatCard label="Completed" value={completed.length} />
            <StatCard label="Shortlisted vendors" value={shortlistedVendorIds.size} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Active decisions</h2>
              <Link href="/decisions/new">
                <Button size="sm"><Plus className="h-3.5 w-3.5" /> New decision</Button>
              </Link>
            </div>
            {active.length === 0 ? (
              <EmptyState icon={<Inbox className="h-8 w-8" />} title="No active decisions yet" description="Start by describing a software requirement in plain English." action={<Link href="/decisions/new"><Button size="sm">Start a decision</Button></Link>} />
            ) : (
              <div className="space-y-3">
                {active.map((d) => {
                  const vendorCount = db.decisionVendors.filter((dv) => dv.decisionId === d.id && dv.shortlisted).length;
                  return (
                    <Link key={d.id} href={`/workspace/${d.id}`}>
                      <Card className="hover:border-slate-300 transition-colors">
                        <CardContent className="flex items-center justify-between py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {vendorCount} vendor{vendorCount === 1 ? "" : "s"} · Last updated {relativeTime(d.updatedAt)}
                            </p>
                          </div>
                          <StatusBadge status={d.status} />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
            <Card>
              <CardContent className="py-2 divide-y divide-slate-100">
                {recent.length === 0 && <p className="text-xs text-slate-400 py-3">No activity yet.</p>}
                {recent.map((e) => (
                  <div key={e.id} className="py-2.5 text-xs">
                    <p className="text-slate-700">{humanizeEvent(e.type)}</p>
                    <p className="text-slate-400 mt-0.5">{relativeTime(e.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Completed decisions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {completed.map((d) => {
                const vendor = db.vendors.find((v) => v.id === d.selectedVendorId);
                return (
                  <Link key={d.id} href={`/decisions/${d.id}`}>
                    <Card className="hover:border-slate-300 transition-colors h-full">
                      <CardHeader>
                        <div>
                          <CardTitle>{d.name}</CardTitle>
                          <p className="text-xs text-slate-500 mt-1">Selected: {vendor?.name || "—"}</p>
                        </div>
                        <Badge variant="success">Decided</Badge>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function humanizeEvent(type: string) {
  return type.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}
