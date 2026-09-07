import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, ScanSearch, SlidersHorizontal, GitCompareArrows, FileBarChart } from "lucide-react";
import { DEMO_VENDORS } from "@/lib/demo-data/vendors";

export default function LandingPage() {
  const vendorCount = DEMO_VENDORS.length;
  const categoryCount = new Set(DEMO_VENDORS.map((v) => v.category)).size;

  return (
    <div className="bg-[var(--surface)]">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[var(--brand-ink)] text-white flex items-center justify-center text-sm font-bold">MQ</div>
            <span className="font-semibold text-lg tracking-tight">MATCHIQ</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/vendors" className="hover:text-slate-900">Vendor directory</Link>
            <Link href="/login" className="hover:text-slate-900">Sign in</Link>
          </nav>
          <Link href="/signup"><Button size="sm">Start a decision</Button></Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="muted" className="mb-4">Decision intelligence for B2B software buying</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Turn a software requirement into a decision you can defend.
            </h1>
            <p className="mt-5 text-base text-slate-600 leading-relaxed">
              Describe what your team needs in plain English. MATCHIQ extracts a structured requirement, scores real
              vendor data against your weighted criteria with a deterministic engine, and generates a report your
              stakeholders will actually trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup"><Button size="lg">Start a decision <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/vendors"><Button size="lg" variant="outline">Browse vendor directory</Button></Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {vendorCount} synthetic demo vendors across {categoryCount} categories. Clearly labelled demo data, no real vendor partnerships implied.
            </p>
          </div>
          <Card className="p-1">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Example requirement</p>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3">
                “We are a 30-person marketing agency looking for CRM software. We need pipeline management, automated
                email workflows, reporting, Slack integration and strong onboarding. Our budget is around £500 per month.”
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Best overall", vendor: "Pipestream", score: 92 },
                  { label: "Best value", vendor: "Corelead", score: 88 },
                  { label: "Best functionality", vendor: "Vantropy", score: 90 },
                ].map((r) => (
                  <div key={r.label} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{r.label}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{r.vendor}</p>
                    <p className="text-lg font-bold text-[var(--brand-ink)]">{r.score}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-semibold text-slate-900 text-center">From free text to a defensible decision</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ScanSearch, title: "Extract & clarify", desc: "Natural-language requirement extraction, refined with 3-5 targeted clarification questions." },
              { icon: SlidersHorizontal, title: "Weight what matters", desc: "Build weighted criteria; MATCHIQ normalises weights to 100% automatically." },
              { icon: GitCompareArrows, title: "Score & compare", desc: "A deterministic scoring engine, never an LLM guess, ranks and compares up to 5 vendors." },
              { icon: FileBarChart, title: "Report & decide", desc: "Explainable trade-offs, team voting, and a polished, printable decision report." },
            ].map((f) => (
              <div key={f.title}>
                <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center">
                  <f.icon className="h-4.5 w-4.5 text-[var(--brand-ink)]" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
            {[
              "Deterministic, reproducible scoring — never an LLM guess",
              "Explainable recommendations with strengths, trade-offs and risks",
              "Team voting, comments and structured notes",
              "Organisation-level access control, ready for Row Level Security",
              "Printable, structured decision reports",
              "Works fully offline in demo mode — no API key required",
            ].map((line) => (
              <div key={line} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>MATCHIQ is a portfolio demonstration build. Vendor catalogue is synthetic demo data.</p>
          <p>© {new Date().getFullYear()} MATCHIQ</p>
        </div>
      </footer>
    </div>
  );
}
