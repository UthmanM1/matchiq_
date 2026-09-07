import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { db } from "@/lib/store/db";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/decision/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";
import { Plus, ListChecks } from "lucide-react";

export const metadata = { title: "Decisions" };

export default async function DecisionsPage() {
  const session = await getSession();
  if (!session) return null;
  const decisions = DecisionService.listForOrg(session.organisationId);

  return (
    <div>
      <Topbar title="Decisions" fullName={session.fullName} subtitle={`${decisions.length} decision${decisions.length === 1 ? "" : "s"} in your organisation`} />
      <div className="p-4 lg:p-8 space-y-4">
        <div className="flex justify-end">
          <Link href="/decisions/new"><Button size="sm"><Plus className="h-3.5 w-3.5" /> New decision</Button></Link>
        </div>

        {decisions.length === 0 ? (
          <EmptyState icon={<ListChecks className="h-8 w-8" />} title="No decisions yet" description="Create your first software decision to get started." action={<Link href="/decisions/new"><Button size="sm">New decision</Button></Link>} />
        ) : (
          <div className="grid gap-3">
            {decisions.map((d) => {
              const shortlist = db.decisionVendors.filter((dv) => dv.decisionId === d.id && dv.shortlisted);
              const topScore = shortlist.reduce((max, dv) => Math.max(max, dv.score?.overallScore || 0), 0);
              return (
                <Card key={d.id} className="hover:border-slate-300 transition-colors">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {d.category} · {shortlist.length} vendor{shortlist.length === 1 ? "" : "s"}{topScore > 0 ? ` · top score ${topScore}%` : ""} · Updated {relativeTime(d.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/workspace/${d.id}`}><Button size="sm" variant="outline">Workspace</Button></Link>
                      <Link href={`/decisions/${d.id}`}><Button size="sm">Results</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
