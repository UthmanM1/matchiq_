import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/store/db";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const org = db.organisations.find((o) => o.id === session.organisationId);

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      <Sidebar orgName={org?.name || "Your organisation"} />
      <div className="flex-1 min-w-0 pb-16 lg:pb-0">{children}</div>
      <MobileNav />
    </div>
  );
}
