import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader({ session }: { session: { fullName: string } | null }) {
  return (
    <header className="border-b border-slate-200 bg-white no-print">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-[var(--brand-ink)] text-white flex items-center justify-center text-sm font-bold">MQ</div>
          <span className="font-semibold text-lg tracking-tight">MATCHIQ</span>
        </Link>
        {session ? (
          <Link href="/dashboard"><Button size="sm" variant="outline">Go to dashboard</Button></Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login"><Button size="sm" variant="ghost">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm">Start a decision</Button></Link>
          </div>
        )}
      </div>
    </header>
  );
}
