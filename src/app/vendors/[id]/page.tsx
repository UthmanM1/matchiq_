import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { VendorService } from "@/lib/services/VendorService";
import { db } from "@/lib/store/db";
import { DecisionService } from "@/lib/services/DecisionService";
import { PublicHeader } from "@/components/nav/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { formatCurrency } from "@/lib/utils";
import { Star, ShieldCheck, Plug, Clock, Headset, ExternalLink } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await VendorService.get(id);
  return { title: vendor ? vendor.name : "Vendor" };
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await VendorService.get(id);
  if (!vendor) notFound();
  const session = await getSession();

  const decisionContexts = session
    ? DecisionService.listForOrg(session.organisationId)
        .map((d) => ({ decision: d, dv: db.decisionVendors.find((x) => x.decisionId === d.id && x.vendorId === id) }))
        .filter((x) => x.dv)
    : [];

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <PublicHeader session={session} />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold">{vendor.logo}</div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{vendor.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="muted">{vendor.category}</Badge>
                <span className="flex items-center gap-1 text-xs text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {vendor.rating} ({vendor.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          <a href={vendor.website} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline">Visit website <ExternalLink className="h-3.5 w-3.5" /></Button>
          </a>
        </div>

        <p className="text-sm text-slate-600 mt-4 leading-relaxed">{vendor.description}</p>
        <Badge variant="warning" className="mt-3">Synthetic demo data — not a real vendor partnership</Badge>

        {decisionContexts.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Your score in this vendor&rsquo;s decisions</p>
            {decisionContexts.map(({ decision, dv }) => (
              <Link key={decision.id} href={`/decisions/${decision.id}`}>
                <Card className="hover:border-slate-300">
                  <CardContent className="flex items-center gap-4 p-4">
                    <ScoreRing value={dv!.score?.overallScore || 0} size={44} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{decision.name}</p>
                      <p className="text-xs text-slate-500">View full criteria breakdown in this decision</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <InfoCard icon={<span className="text-sm font-bold">£</span>} title="Pricing">
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(vendor.startingPrice, vendor.currency)}<span className="text-xs font-normal text-slate-500">/mo starting</span></p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{vendor.pricingModel.replaceAll("_", " ")} pricing · {vendor.companySize} employee companies</p>
          </InfoCard>
          <InfoCard icon={<Clock className="h-4 w-4" />} title="Implementation">
            <p className="text-sm text-slate-900">{vendor.implementationTime}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{vendor.deploymentType.replaceAll("_", " ")} deployment</p>
          </InfoCard>
          <InfoCard icon={<Headset className="h-4 w-4" />} title="Support">
            <p className="text-sm text-slate-900 capitalize">{vendor.supportLevel.replaceAll("_", " ")}</p>
          </InfoCard>
          <InfoCard icon={<ShieldCheck className="h-4 w-4" />} title="Security">
            <div className="flex flex-wrap gap-1.5">{vendor.securityFeatures.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
          </InfoCard>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-900 mb-2">Features</p>
          <div className="flex flex-wrap gap-1.5">{vendor.features.map((f) => <Badge key={f} variant="muted">{f}</Badge>)}</div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5"><Plug className="h-4 w-4" /> Integrations</p>
          <div className="flex flex-wrap gap-1.5">{vendor.integrations.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}</div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-2">{icon} {title}</p>
        {children}
      </CardContent>
    </Card>
  );
}
