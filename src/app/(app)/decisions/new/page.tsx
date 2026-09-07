import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/nav/topbar";
import { NewDecisionWizard } from "@/components/decision/new-decision-wizard";

export const metadata = { title: "New decision" };

export default async function NewDecisionPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div>
      <Topbar title="New decision" fullName={session.fullName} subtitle="Describe what you need in plain English — MATCHIQ will structure it" />
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <NewDecisionWizard />
      </div>
    </div>
  );
}
