"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ListChecks, Building2, LayoutGrid, FileBarChart, BarChart3, Settings, ShieldCheck,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/decisions", label: "Decisions", icon: ListChecks },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/workspace", label: "Workspace", icon: LayoutGrid },
  { href: "/compare", label: "Compare", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-[var(--brand-ink)] text-white flex items-center justify-center text-xs font-bold">MQ</div>
          <span className="font-semibold tracking-tight text-slate-900">MATCHIQ</span>
        </Link>
        <p className="mt-1 text-[11px] text-slate-500 truncate">{orgName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto matchiq-scrollbar px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Demo data. Vendor catalogue is synthetic and for demonstration only.
        </p>
      </div>
    </aside>
  );
}
