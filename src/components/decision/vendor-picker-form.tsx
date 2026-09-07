"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Vendor } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function VendorPickerForm({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 5 ? [...s, id] : s));
  }

  return (
    <div className="max-w-2xl">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vendors to compare..." />
      <p className="text-xs text-slate-400 mt-2">{selected.length}/5 selected</p>
      <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto matchiq-scrollbar">
        {filtered.map((v) => (
          <button
            key={v.id}
            onClick={() => toggle(v.id)}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-left ${selected.includes(v.id) ? "border-[var(--brand-ink)] bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-900">{v.name}</p>
              <p className="text-[11px] text-slate-500">{v.category} · {formatCurrency(v.startingPrice, v.currency)}/mo</p>
            </div>
            {selected.includes(v.id) && <Badge>✓</Badge>}
          </button>
        ))}
      </div>
      <Button className="mt-4" disabled={selected.length < 2} onClick={() => router.push(`/compare?ids=${selected.join(",")}`)}>
        Compare {selected.length} vendors
      </Button>
    </div>
  );
}
