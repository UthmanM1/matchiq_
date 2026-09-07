import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { RequirementService } from "@/lib/services/RequirementService";
import { CriteriaService } from "@/lib/services/CriteriaService";
import { VendorService } from "@/lib/services/VendorService";
import { AIService } from "@/lib/services/AIService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge } from "@/components/decision/status-badge";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight } from "lucide-react";

export const metadata = { title: "Recommendation" };

export default async function DecisionResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const decision = DecisionService.get(id);
  if (!decision || decision.organisationId !== session.organisationId) notFound();
  const requirement = RequirementService.getByDecision(id);
  if (!requirement) notFound();
  const criteria = CriteriaService.list(id);

  await DecisionService.rescoreAll(id);
  const shortlist = DecisionService.getShortlist(id);

  const rows = [];
  for (const dv of shortlist) {
    const vendor = await VendorService.get(dv.vendorId);
    if (!vendor || !dv.score) continue;
    const explanation = await AIService.explainRecommendation(vendor, requirement, criteria, dv.score);
    rows.push({ vendor, score: dv.score, explanation });
  }
  rows.sort((a, b) => b.score.overallScore - a.score.overallScore);

  if (rows.length === 0) {
    return (
      <div>
        <Topbar title={decision.name} fullName={session.fullName} subtitle="No scored vendors yet" />
        <div className="p-4 lg:p-8">
          <Card><CardContent className="py-10 text-center">
            <p className="text-sm text-slate-600">Shortlist some vendors in the workspace to see recommendations here.</p>
            <Link href={`/workspace/${id}`}><Button size="sm" className="mt-4">Open workspace</Button></Link>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  const bestOverall = rows[0];
  const bestValue = [...rows].sort((a, b) => b.score.valueScore - a.score.valueScore)[0];
  const bestFunctionality = [...rows].sort((a, b) => b.score.featureScore - a.score.featureScore)[0];

  const highlights = [
    { label: "Best overall", tone: "success" as const, row: bestOverall, blurb: "Strongest fit for your priorities." },
    { label: "Best value", tone: "info" as const, row: bestValue, blurb: "Best balance of price and functionality." },
    { label: "Best functionality", tone: "warning" as const, row: bestFunctionality, blurb: "Most advanced capabilities on offer." },
  ].filter((h, i, arr) => arr.findIndex((x) => x.row.vendor.id === h.row.vendor.id) === i || i === 0);

  return (
    <div>
      <Topbar title={decision.name} fullName={session.fullName} subtitle="Recommendation results" />
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={decision.status} />
            <span className="text-xs text-slate-500">{criteria.length} criteria · {rows.length} vendors evaluated</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/workspace/${id}`}><Button size="sm" variant="outline">Edit criteria</Button></Link>
            <Link href={`/decisions/${id}/report`}><Button size="sm"><FileText className="h-3.5 w-3.5" /> Decision report</Button></Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {highlights.map((h) => (
            <Card key={h.label}>
              <CardContent className="p-5">
                <Badge variant={h.tone}>{h.label.toUpperCase()}</Badge>
                <div className="flex items-center gap-3 mt-3">
                  <ScoreRing value={h.row.score.overallScore} size={48} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{h.row.vendor.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(h.row.vendor.startingPrice, h.row.vendor.currency)}/mo</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3">{h.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-900">All evaluated vendors, ranked</p>
          {rows.map((r, i) => (
            <Card key={r.vendor.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <ScoreRing value={r.score.overallScore} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">#{i + 1} {r.vendor.name}</p>
                      <Badge variant="outline">{formatCurrency(r.vendor.startingPrice, r.vendor.currency)}/mo</Badge>
                      <Badge variant="outline">{r.vendor.implementationTime}</Badge>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">{r.explanation.summary}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{r.explanation.evidenceNote}</p>

                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1.5">Why it matches</p>
                        <ul className="space-y-1">
                          {r.explanation.strengths.length === 0 && <li className="text-xs text-slate-400">No standout strengths against current criteria.</li>}
                          {r.explanation.strengths.map((s) => (
                            <li key={s} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1.5">Where it falls short</p>
                        <ul className="space-y-1">
                          {r.explanation.weaknesses.length === 0 && <li className="text-xs text-slate-400">No material weaknesses identified.</li>}
                          {r.explanation.weaknesses.map((w) => (
                            <li key={w} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <XCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" /> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {requirement.budgetMax && r.vendor.startingPrice > requirement.budgetMax && (
                      <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-700 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800">Trade-off: sits above your stated budget of {formatCurrency(requirement.budgetMax, requirement.currency)}/mo.</p>
                      </div>
                    )}
                  </div>
                  <Link href={`/vendors/${r.vendor.id}`} className="shrink-0">
                    <Button size="sm" variant="outline">Full profile <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
