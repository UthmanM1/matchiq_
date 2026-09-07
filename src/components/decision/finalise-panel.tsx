"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Vendor, DecisionVendor } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export function FinalisePanel({
  decisionId,
  shortlist,
  selectedVendorId,
  rationale: existingRationale,
}: {
  decisionId: string;
  shortlist: { dv: DecisionVendor; vendor: Vendor }[];
  selectedVendorId?: string;
  rationale?: string;
}) {
  const router = useRouter();
  const [vendorId, setVendorId] = useState(selectedVendorId || shortlist[0]?.vendor.id || "");
  const [rationale, setRationale] = useState(existingRationale || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decided = Boolean(selectedVendorId);

  async function submit() {
    if (!vendorId || !rationale.trim()) {
      setError("Choose a vendor and give a short rationale.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/decisions/${decisionId}/finalise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedVendorId: vendorId, rationale }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json()).error);
      return;
    }
    router.refresh();
  }

  if (shortlist.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          {decided && <CheckCircle2 className="h-4 w-4 text-emerald-600" />} Final decision
        </p>
        <label className="block text-xs font-medium text-slate-700">
          Selected vendor
          <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="mt-1" disabled={decided}>
            {shortlist.map(({ vendor, dv }) => (
              <option key={vendor.id} value={vendor.id}>{vendor.name} ({dv.score?.overallScore ?? "—"}%)</option>
            ))}
          </Select>
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Decision rationale
          <Textarea rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} disabled={decided} placeholder="Selected because it provides the best combination of..." className="mt-1" />
        </label>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {!decided && (
          <Button onClick={submit} disabled={loading} className="w-full sm:w-auto">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Confirm final decision"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
