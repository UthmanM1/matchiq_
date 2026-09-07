"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Vendor, DecisionVendor, VoteValue } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { formatCurrency } from "@/lib/utils";
import { Plus, X, ChevronDown, ChevronUp, ThumbsUp, Minus, ThumbsDown } from "lucide-react";

interface ShortlistItem {
  dv: DecisionVendor;
  vendor: Vendor;
}

const VOTE_CONFIG: { value: VoteValue; label: string; icon: typeof ThumbsUp }[] = [
  { value: "strong_choice", label: "Strong choice", icon: ThumbsUp },
  { value: "acceptable", label: "Acceptable", icon: Minus },
  { value: "not_suitable", label: "Not suitable", icon: ThumbsDown },
];

export function ShortlistPanel({
  decisionId,
  shortlist,
  availableVendors,
  votesByVendor,
}: {
  decisionId: string;
  shortlist: ShortlistItem[];
  availableVendors: Vendor[];
  votesByVendor: Record<string, { strong_choice: number; acceptable: number; not_suitable: number; total: number }>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const shortlistedIds = new Set(shortlist.map((s) => s.vendor.id));
  const pickable = availableVendors.filter((v) => !shortlistedIds.has(v.id));

  async function addVendor(vendorId: string) {
    await fetch(`/api/decisions/${decisionId}/shortlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId }),
    });
    startTransition(() => router.refresh());
  }

  async function removeVendor(vendorId: string) {
    await fetch(`/api/decisions/${decisionId}/shortlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, action: "remove" }),
    });
    startTransition(() => router.refresh());
  }

  async function castVote(vendorId: string, value: VoteValue) {
    await fetch(`/api/decisions/${decisionId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, value }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Shortlist ({shortlist.length})</p>
        <Button size="sm" variant="outline" onClick={() => setPickerOpen((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add vendor
        </Button>
      </div>

      {pickerOpen && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Vendors in this category not yet shortlisted</p>
            <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto matchiq-scrollbar">
              {pickable.length === 0 && <p className="text-xs text-slate-400">All category vendors are already shortlisted.</p>}
              {pickable.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addVendor(v.id)}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left hover:border-slate-300 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{v.name}</p>
                    <p className="text-[11px] text-slate-500">{formatCurrency(v.startingPrice, v.currency)}/mo · ★{v.rating}</p>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {shortlist.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-slate-400">No vendors shortlisted yet. Add some to start scoring.</CardContent></Card>
      )}

      <div className="space-y-3">
        {shortlist.map(({ dv, vendor }, idx) => {
          const votes = votesByVendor[vendor.id] || { strong_choice: 0, acceptable: 0, not_suitable: 0, total: 0 };
          const isOpen = expanded === vendor.id;
          return (
            <Card key={vendor.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <ScoreRing value={dv.score?.overallScore || 0} size={52} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">#{idx + 1} {vendor.name}</p>
                      {idx === 0 && <Badge variant="success">Top ranked</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(vendor.startingPrice, vendor.currency)}/mo · {vendor.implementationTime} to implement · ★{vendor.rating} ({vendor.reviewCount})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {vendor.features.slice(0, 4).map((f) => <Badge key={f} variant="muted">{f}</Badge>)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => removeVendor(vendor.id)} className="text-slate-300 hover:text-rose-500" title="Remove from shortlist">
                      <X className="h-4 w-4" />
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : vendor.id)} className="text-slate-400 hover:text-slate-700">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && dv.score && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        ["Price", dv.score.priceScore],
                        ["Features", dv.score.featureScore],
                        ["Integrations", dv.score.integrationScore],
                        ["Usability", dv.score.usabilityScore],
                        ["Security", dv.score.securityScore],
                        ["Support", dv.score.supportScore],
                        ["Implementation", dv.score.implementationScore],
                        ["Value", dv.score.valueScore],
                      ].map(([label, val]) => (
                        <div key={label as string} className="rounded-md bg-slate-50 px-2.5 py-2">
                          <p className="text-[10px] text-slate-500">{label}</p>
                          <p className="text-sm font-semibold text-slate-900">{val}%</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Team votes</p>
                      <div className="flex gap-2 flex-wrap">
                        {VOTE_CONFIG.map((v) => (
                          <button
                            key={v.value}
                            onClick={() => castVote(vendor.id, v.value)}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:border-slate-300"
                          >
                            <v.icon className="h-3.5 w-3.5" /> {v.label} <span className="text-slate-400">({votes[v.value]})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Link href={`/vendors/${vendor.id}`} className="text-xs text-[var(--brand-ink)] underline underline-offset-2 inline-block">
                      View full vendor profile →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
