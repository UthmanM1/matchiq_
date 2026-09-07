"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ALL_CATEGORIES } from "@/lib/demo-data/categories";
import { Loader2, Sparkles } from "lucide-react";

type Step = "describe" | "clarify" | "done";

interface Question {
  id: string;
  question: string;
  options: string[];
  rationale: string;
}

const EXAMPLE =
  "We are a 30-person marketing agency looking for CRM software. We need pipeline management, automated email workflows, reporting, Slack integration and strong onboarding. Our budget is around £500 per month.";

export function NewDecisionWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("describe");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES[0]);
  const [rawInput, setRawInput] = useState("");
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extracted, setExtracted] = useState<{ category: string; requiredFeatures: string[]; budgetMax?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyse() {
    if (rawInput.trim().length < 12) {
      setError("Add a bit more detail about what you need first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const createRes = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || `${category} selection`, category }),
      });
      if (!createRes.ok) throw new Error((await createRes.json()).error);
      const { decision } = await createRes.json();
      setDecisionId(decision.id);

      const reqRes = await fetch(`/api/decisions/${decision.id}/requirement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });
      if (!reqRes.ok) throw new Error((await reqRes.json()).error);
      const data = await reqRes.json();
      setExtracted(data.requirement);
      setQuestions(data.questions);
      setStep("clarify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function finishClarification() {
    if (!decisionId) return;
    setLoading(true);
    try {
      for (const q of questions) {
        const answer = answers[q.id];
        if (!answer) continue;
        await fetch(`/api/decisions/${decisionId}/clarify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: q.id, answer }),
        });
      }
      router.push(`/workspace/${decisionId}`);
    } finally {
      setLoading(false);
    }
  }

  if (step === "describe") {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <label className="block text-xs font-medium text-slate-700">
            Decision name (optional)
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CRM Platform Selection" className="mt-1" />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Category
            <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="mt-1">
              {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Describe what you need
            <Textarea rows={6} value={rawInput} onChange={(e) => setRawInput(e.target.value)} placeholder={EXAMPLE} className="mt-1" />
            <button type="button" className="mt-1 text-[11px] text-[var(--brand-ink)] underline underline-offset-2" onClick={() => setRawInput(EXAMPLE)}>
              Use example
            </button>
          </label>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <Button onClick={analyse} disabled={loading} className="w-full sm:w-auto">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</> : <><Sparkles className="h-4 w-4" /> Analyse requirement</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "clarify") {
    return (
      <div className="space-y-4">
        {extracted && (
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Extracted requirement</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">{extracted.category}</Badge>
                {extracted.budgetMax && <Badge variant="outline">Budget up to £{extracted.budgetMax}/mo</Badge>}
                {extracted.requiredFeatures.map((f) => <Badge key={f} variant="muted">{f}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-6 space-y-5">
            <p className="text-sm font-semibold text-slate-900">A few quick questions</p>
            {questions.map((q) => (
              <div key={q.id}>
                <p className="text-sm text-slate-800">{q.question}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        answers[q.id] === opt ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={finishClarification} disabled={loading} className="w-full sm:w-auto">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up workspace...</> : "Continue to workspace"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
