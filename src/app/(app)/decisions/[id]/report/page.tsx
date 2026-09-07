import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { ReportService } from "@/lib/services/ReportService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { GenerateReportButton } from "@/components/decision/generate-report-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VendorScoreBreakdown } from "@/types";

export const metadata = { title: "Decision report" };

interface Snapshot {
  decision: { id: string; name: string; status: string; category: string; owner: string };
  requirement: {
    rawInput: string;
    category: string;
    companySize?: number;
    budgetMin?: number;
    budgetMax?: number;
    currency: string;
    requiredFeatures: string[];
    preferredFeatures: string[];
    integrationRequirements: string[];
  };
  criteria: { id: string; name: string; weight: number; importance: string }[];
  vendorRows: {
    vendorId: string;
    name: string;
    category: string;
    startingPrice: number;
    currency: string;
    overallScore: number;
    breakdown: VendorScoreBreakdown;
    explanation: { summary: string; strengths: string[]; weaknesses: string[]; evidenceNote: string };
    votes: { strong_choice: number; acceptable: number; not_suitable: number; total: number };
  }[];
  selectedVendor?: { id: string; name: string };
  rationale?: string;
  decisionDate?: string;
  generatedAt: string;
}

export default async function DecisionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const decision = DecisionService.get(id);
  if (!decision || decision.organisationId !== session.organisationId) notFound();

  const report = ReportService.latest(id);
  const snapshot = report?.snapshot as unknown as Snapshot | undefined;

  return (
    <div>
      <Topbar title="Decision report" fullName={session.fullName} subtitle={decision.name} />
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
        <GenerateReportButton decisionId={id} hasReport={Boolean(snapshot)} />

        {!snapshot ? (
          <Card><CardContent className="py-12 text-center text-sm text-slate-500">No report generated yet. Click &ldquo;Generate decision report&rdquo; above.</CardContent></Card>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-8 print:border-0 print:shadow-none" id="report-root">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-[var(--brand-ink)] text-white flex items-center justify-center text-xs font-bold">MQ</div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">MATCHIQ Decision Report</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-3">{snapshot.decision.name}</h1>
              <p className="text-xs text-slate-500 mt-1">
                {snapshot.decision.category} · Owner: {snapshot.decision.owner} · Generated {formatDate(snapshot.generatedAt)}
              </p>
            </div>

            <Section title="Executive summary">
              <p className="text-sm text-slate-700 leading-relaxed">
                {snapshot.vendorRows.length} vendor{snapshot.vendorRows.length === 1 ? "" : "s"} evaluated against {snapshot.criteria.length} weighted
                criteria using MATCHIQ&rsquo;s deterministic scoring engine.{" "}
                {snapshot.selectedVendor
                  ? `${snapshot.selectedVendor.name} was selected as the final choice.`
                  : "A final selection has not yet been confirmed."}
              </p>
            </Section>

            <Section title="Business requirement">
              <p className="text-sm text-slate-700 italic">&ldquo;{snapshot.requirement.rawInput}&rdquo;</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline">{snapshot.requirement.category}</Badge>
                {snapshot.requirement.companySize && <Badge variant="outline">{snapshot.requirement.companySize} employees</Badge>}
                {snapshot.requirement.budgetMax && (
                  <Badge variant="outline">
                    Budget {formatCurrency(snapshot.requirement.budgetMin || 0, snapshot.requirement.currency)}-{formatCurrency(snapshot.requirement.budgetMax, snapshot.requirement.currency)}/mo
                  </Badge>
                )}
              </div>
            </Section>

            <Section title="Decision criteria & weights">
              <div className="space-y-2">
                {snapshot.criteria.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-700 w-40 truncate">{c.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[var(--brand-ink)]" style={{ width: `${c.weight}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-10 text-right">{c.weight}%</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Score comparison">
              <div className="grid sm:grid-cols-3 gap-4">
                {snapshot.vendorRows.map((r) => (
                  <div key={r.vendorId} className="flex items-center gap-3 rounded-md border border-slate-100 p-3">
                    <ScoreRing value={r.overallScore} size={44} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{r.name}</p>
                      <p className="text-[11px] text-slate-500">{formatCurrency(r.startingPrice, r.currency)}/mo</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Detailed evaluation & trade-offs">
              <div className="space-y-4">
                {snapshot.vendorRows.map((r) => (
                  <div key={r.vendorId} className="border-b border-slate-100 pb-4 last:border-0">
                    <p className="text-sm font-semibold text-slate-900">{r.name} — {r.overallScore}%</p>
                    <p className="text-xs text-slate-600 mt-1">{r.explanation.summary}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{r.explanation.evidenceNote}</p>
                    <div className="grid sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-[10px] font-medium text-emerald-700 uppercase">Strengths</p>
                        <ul className="text-xs text-slate-600">{r.explanation.strengths.map((s) => <li key={s}>+ {s}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-rose-600 uppercase">Risks / watch-outs</p>
                        <ul className="text-xs text-slate-600">{r.explanation.weaknesses.length ? r.explanation.weaknesses.map((w) => <li key={w}>- {w}</li>) : <li>None material</li>}</ul>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Team votes: {r.votes.strong_choice} strong choice · {r.votes.acceptable} acceptable · {r.votes.not_suitable} not suitable
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Final recommendation">
              {snapshot.selectedVendor ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">Selected: {snapshot.selectedVendor.name}</p>
                  {snapshot.rationale && <p className="text-xs text-slate-600 mt-1">{snapshot.rationale}</p>}
                  {snapshot.decisionDate && <p className="text-[10px] text-slate-400 mt-1">Decided {formatDate(snapshot.decisionDate)}</p>}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No final selection has been confirmed yet for this decision.</p>
              )}
            </Section>

            <p className="text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100">
              Generated by MATCHIQ. Vendor catalogue is synthetic demo data — no real vendor partnerships, pricing agreements or certifications are implied.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</h2>
      {children}
    </div>
  );
}
