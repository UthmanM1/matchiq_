"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { LogOut } from "lucide-react";

export function Topbar({ title, fullName, subtitle }: { title: string; fullName: string; subtitle?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-4 lg:px-8 py-3 no-print">
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold">
          {initials(fullName)}
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
