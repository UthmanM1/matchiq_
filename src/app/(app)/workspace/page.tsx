import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/decision/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

export const metadata = { title: "Workspace" };

export default async function WorkspacePickerPage() {
  const session = await getSession();
  if (!session) return null;
  const decisions = DecisionService.listForOrg(session.organisationId);

  return (
    <div>
      <Topbar title="Workspace" fullName={session.fullName} subtitle="Pick a decision to open its working environment" />
      <div className="p-4 lg:p-8">
        {decisions.length === 0 ? (
          <EmptyState icon={<LayoutGrid className="h-8 w-8" />} title="Nothing to work on yet" description="Create a decision to open its workspace." action={<Link href="/decisions/new"><Button size="sm">New decision</Button></Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {decisions.map((d) => (
              <Link key={d.id} href={`/workspace/${d.id}`}>
                <Card className="h-full hover:border-slate-300 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{d.category} · Updated {relativeTime(d.updatedAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
