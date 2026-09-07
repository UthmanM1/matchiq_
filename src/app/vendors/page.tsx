import Link from "next/link";
import { getSession } from "@/lib/auth";
import { VendorService } from "@/lib/services/VendorService";
import { ALL_CATEGORIES } from "@/lib/demo-data/categories";
import { PublicHeader } from "@/components/nav/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { VendorCategory } from "@/types";
import { Star } from "lucide-react";

export const metadata = {
  title: "Vendor directory",
  description: "Browse the MATCHIQ synthetic demo vendor catalogue across 10 B2B software categories.",
};

export default async function VendorsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  const category = (params.category as VendorCategory | "All") || "All";
  const search = params.q;

  const vendors = await VendorService.list({ category, search });

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <PublicHeader session={session} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Vendor directory</h1>
            <p className="text-xs text-slate-500 mt-1">{vendors.length} vendors · synthetic demo catalogue, not real vendor partnerships</p>
          </div>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={search}
              placeholder="Search vendors..."
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal)]"
            />
            <input type="hidden" name="category" value={category} />
            <button className="h-9 px-4 rounded-md bg-[var(--brand-ink)] text-white text-sm font-medium">Search</button>
          </form>
        </div>

        <div className="mt-5 flex gap-2 flex-wrap">
          <CategoryChip label="All" active={category === "All"} search={search} />
          {ALL_CATEGORIES.map((c) => <CategoryChip key={c} label={c} active={category === c} search={search} />)}
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <Link key={v.id} href={`/vendors/${v.id}`}>
              <Card className="h-full hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{v.logo}</div>
                    <Badge variant="muted">{v.category}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-3">{v.name}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-semibold text-slate-900">{formatCurrency(v.startingPrice, v.currency)}/mo</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {v.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {v.features.slice(0, 2).map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {vendors.length === 0 && <p className="text-sm text-slate-500 mt-10 text-center">No vendors match those filters.</p>}
      </div>
    </div>
  );
}

function CategoryChip({ label, active, search }: { label: string; active: boolean; search?: string }) {
  const qs = new URLSearchParams();
  qs.set("category", label);
  if (search) qs.set("q", search);
  return (
    <Link
      href={`/vendors?${qs.toString()}`}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
    >
      {label}
    </Link>
  );
}
