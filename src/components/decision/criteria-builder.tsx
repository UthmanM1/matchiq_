"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DecisionCriterion, CriteriaImportance } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { round1 } from "@/lib/utils";

const IMPORTANCE_VARIANT: Record<CriteriaImportance, "danger" | "warning" | "muted"> = {
  required: "danger",
  important: "warning",
  optional: "muted",
};

export function CriteriaBuilder({ decisionId, criteria }: { decisionId: string; criteria: DecisionCriterion[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(Object.fromEntries(criteria.map((c) => [c.id, c.weight])));
  const [newName, setNewName] = useState("");

  const totalRaw = criteria.reduce((s, c) => s + (localWeights[c.id] ?? c.weight), 0);

  async function commitWeight(id: string, weight: number) {
    await fetch(`/api/decisions/${decisionId}/criteria/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight }),
    });
    startTransition(() => router.refresh());
  }

  async function setImportance(id: string, importance: CriteriaImportance) {
    await fetch(`/api/decisions/${decisionId}/criteria/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importance }),
    });
    startTransition(() => router.refresh());
  }

  async function removeCriterion(id: string) {
    await fetch(`/api/decisions/${decisionId}/criteria/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  async function addCriterion() {
    if (!newName.trim()) return;
    await fetch(`/api/decisions/${decisionId}/criteria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, weight: 10, importance: "important" }),
    });
    setNewName("");
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Decision criteria</p>
          <Badge variant={Math.round(totalRaw) === 100 ? "success" : "muted"}>{round1(totalRaw)}% of weight allocated</Badge>
        </div>
        <p className="text-xs text-slate-500 -mt-2">Weights are normalised to sum to 100% automatically whenever you add, remove, or adjust one.</p>

        <div className="space-y-4">
          {criteria.map((c) => (
            <div key={c.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                  <Select
                    value={c.importance}
                    onChange={(e) => setImportance(c.id, e.target.value as CriteriaImportance)}
                    className="h-6 !w-auto text-[10px] px-1.5"
                  >
                    <option value="required">Required</option>
                    <option value="important">Important</option>
                    <option value="optional">Optional</option>
                  </Select>
                  <Badge variant={IMPORTANCE_VARIANT[c.importance]} className="hidden">{c.importance}</Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-700 w-10 text-right">{round1(localWeights[c.id] ?? c.weight)}%</span>
                  <button onClick={() => removeCriterion(c.id)} className="text-slate-300 hover:text-rose-500" title="Remove criterion">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Slider
                value={localWeights[c.id] ?? c.weight}
                min={0}
                max={50}
                onChange={(v) => setLocalWeights((w) => ({ ...w, [c.id]: v }))}
                className="mt-2"
              />
              <div className="flex justify-end">
                <button
                  className="text-[10px] text-[var(--brand-ink)] mt-1 disabled:opacity-0"
                  disabled={localWeights[c.id] === c.weight}
                  onClick={() => commitWeight(c.id, localWeights[c.id])}
                >
                  Save weight
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add a criterion, e.g. Data residency" />
          <Button size="sm" onClick={addCriterion} disabled={isPending}><Plus className="h-3.5 w-3.5" /> Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}
