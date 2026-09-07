import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { ReportService } from "@/lib/services/ReportService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { FileBarChart } from "lucide-react";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) return null;
  const decisions = DecisionService.listForOrg(session.organisationId);
  const withReports = decisions
    .map((d) => ({ decision: d, reports: ReportService.list(d.id) }))
    .filter((x) => x.reports.length > 0);

  return (
    <div>
      <Topbar title="Reports" fullName={session.fullName} subtitle="Generated decision reports across your organisation" />
      <div className="p-4 lg:p-8">
        {withReports.length === 0 ? (
          <EmptyState icon={<FileBarChart className="h-8 w-8" />} title="No reports generated yet" description="Open a decision's results page and generate a report once you have a shortlist scored." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {withReports.map(({ decision, reports }) => {
              const latest = reports[reports.length - 1];
              return (
                <Link key={decision.id} href={`/decisions/${decision.id}/report`}>
                  <Card className="hover:border-slate-300 transition-colors h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{decision.name}</p>
                        <Badge variant="outline">{decision.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {reports.length} version{reports.length === 1 ? "" : "s"} · Latest {formatDate(latest.generatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
