import { getSession } from "@/lib/auth";
import { ComparisonService } from "@/lib/services/ComparisonService";
import { VendorService } from "@/lib/services/VendorService";
import { DecisionService } from "@/lib/services/DecisionService";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { GitCompareArrows } from "lucide-react";
import { VendorPickerForm } from "@/components/decision/vendor-picker-form";

export const metadata = { title: "Compare vendors" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) return null;

  const ids = (params.ids || "").split(",").filter(Boolean).slice(0, 5);
  const decisionId = params.decisionId;
  const allVendors = await VendorService.list();

  if (ids.length === 0) {
    return (
      <div>
        <Topbar title="Compare vendors" fullName={session.fullName} subtitle="Pick up to 5 vendors to compare side by side" />
        <div className="p-4 lg:p-8">
          <VendorPickerForm vendors={allVendors} />
        </div>
      </div>
    );
  }

  let rows = await ComparisonService.buildComparison(ids);
  if (decisionId) rows = ComparisonService.attachDecisionContext(rows, decisionId);
  ComparisonService.logStart(session.organisationId, session.userId, ids);
  const highlights = ComparisonService.highlights(rows);
  ComparisonService.logComplete(session.organisationId, session.userId, ids);

  const decision = decisionId ? DecisionService.get(decisionId) : undefined;

  if (rows.length === 0) {
    return (
      <div>
        <Topbar title="Compare vendors" fullName={session.fullName} />
        <div className="p-4 lg:p-8">
          <EmptyState icon={<GitCompareArrows className="h-8 w-8" />} title="No vendors to compare" description="Select vendors first." />
        </div>
      </div>
    );
  }

  const rowsDef = [
    { label: "Overall score", render: (r: (typeof rows)[number]) => (r.decisionVendor?.score ? `${r.decisionVendor.score.overallScore}%` : "—") },
    { label: "Starting price", render: (r: (typeof rows)[number]) => `${formatCurrency(r.vendor.startingPrice, r.vendor.currency)}/mo` },
    { label: "Pricing model", render: (r: (typeof rows)[number]) => r.vendor.pricingModel.replaceAll("_", " ") },
    { label: "Rating", render: (r: (typeof rows)[number]) => `★ ${r.vendor.rating} (${r.vendor.reviewCount})` },
    { label: "Implementation", render: (r: (typeof rows)[number]) => r.vendor.implementationTime },
    { label: "Support", render: (r: (typeof rows)[number]) => r.vendor.supportLevel.replaceAll("_", " ") },
    { label: "Deployment", render: (r: (typeof rows)[number]) => r.vendor.deploymentType.replaceAll("_", " ") },
    { label: "Key features", render: (r: (typeof rows)[number]) => r.vendor.features.slice(0, 4).join(", ") },
    { label: "Integrations", render: (r: (typeof rows)[number]) => r.vendor.integrations.slice(0, 4).join(", ") },
    { label: "Security", render: (r: (typeof rows)[number]) => r.vendor.securityFeatures.slice(0, 3).join(", ") },
  ];

  return (
    <div>
      <Topbar title="Compare vendors" fullName={session.fullName} subtitle={decision ? `For ${decision.name}` : `${rows.length} vendors`} />
      <div className="p-4 lg:p-8 overflow-x-auto matchiq-scrollbar">
        <div className="min-w-[640px]">
          <div className="grid" style={{ gridTemplateColumns: `160px repeat(${rows.length}, 1fr)` }}>
            <div />
            {rows.map((r) => (
              <Card key={r.vendor.id} className="mx-1">
                <CardContent className="p-4 text-center">
                  <div className="h-9 w-9 mx-auto rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{r.vendor.logo}</div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{r.vendor.name}</p>
                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {highlights?.bestMatch === r.vendor.id && <Badge variant="success">Best match</Badge>}
                    {highlights?.bestValue === r.vendor.id && <Badge variant="info">Best value</Badge>}
                    {highlights?.lowestCost === r.vendor.id && <Badge variant="muted">Lowest cost</Badge>}
                    {highlights?.fastestImplementation === r.vendor.id && <Badge variant="warning">Fastest</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rowsDef.map((rd) => (
            <div key={rd.label} className="grid border-b border-slate-100 py-2.5 items-center" style={{ gridTemplateColumns: `160px repeat(${rows.length}, 1fr)` }}>
              <p className="text-xs font-medium text-slate-500 px-2">{rd.label}</p>
              {rows.map((r) => (
                <p key={r.vendor.id} className="text-xs text-slate-800 px-3 text-center">{rd.render(r)}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
