"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DecisionStatus } from "@/types";
import { STATUS_SEQUENCE } from "./status-badge";
import { Loader2 } from "lucide-react";

const LABELS: Record<DecisionStatus, string> = {
  draft: "Draft",
  researching: "Researching",
  shortlisted: "Shortlisted",
  final_review: "Final review",
  decided: "Decided",
};

export function StatusStepper({ decisionId, status }: { decisionId: string; status: DecisionStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentIdx = STATUS_SEQUENCE.indexOf(status);

  async function setStatus(next: DecisionStatus) {
    setLoading(true);
    await fetch(`/api/decisions/${decisionId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto matchiq-scrollbar">
      {STATUS_SEQUENCE.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center">
            <button
              type="button"
              disabled={loading || s === "decided"}
              onClick={() => setStatus(s)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                active && "bg-[var(--brand-ink)] text-white border-[var(--brand-ink)]",
                done && !active && "bg-emerald-50 text-emerald-700 border-emerald-200",
                !active && !done && "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {LABELS[s]}
            </button>
            {i < STATUS_SEQUENCE.length - 1 && <div className={cn("h-px w-4", done ? "bg-emerald-300" : "bg-slate-200")} />}
          </div>
        );
      })}
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 ml-1" />}
    </div>
  );
}
