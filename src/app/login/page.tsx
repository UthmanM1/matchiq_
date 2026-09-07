"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_LOGIN_EMAIL } from "@/lib/auth-constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent, useEmail?: string) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: useEmail || email }),
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
          <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
          <p className="text-xs text-slate-500 mt-1">Demo authentication — no password required for this build.</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Work email
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1" />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" className="w-full" onClick={(e) => submit(e as unknown as React.FormEvent, DEMO_LOGIN_EMAIL)} disabled={loading}>
              Continue with demo account
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            No account? <Link href="/signup" className="text-[var(--brand-ink)] font-medium underline underline-offset-2">Create one</Link>
          </p>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/">← Back to MATCHIQ</Link>
        </p>
      </div>
    </div>
  );
}
