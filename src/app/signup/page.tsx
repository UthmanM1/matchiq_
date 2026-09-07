"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", organisationName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-md bg-[var(--brand-ink)] text-white flex items-center justify-center text-sm font-bold">MQ</div>
          <span className="font-semibold text-lg tracking-tight">MATCHIQ</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Create your workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Sets up a new organisation with you as the owner.</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Full name
              <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Jordan Lee" className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Work email
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Organisation name
              <Input required value={form.organisationName} onChange={(e) => setForm({ ...form, organisationName: e.target.value })} placeholder="Acme Ltd" className="mt-1" />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create workspace"}</Button>
          </form>
          <p className="text-xs text-slate-500 mt-4 text-center">
            Already have a workspace? <Link href="/login" className="text-[var(--brand-ink)] font-medium underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
