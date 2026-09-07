import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";
import { RequirementService } from "@/lib/services/RequirementService";
import { CriteriaService } from "@/lib/services/CriteriaService";
import { VendorService } from "@/lib/services/VendorService";
import { CollaborationService } from "@/lib/services/CollaborationService";
import { Topbar } from "@/components/nav/topbar";
import { WorkspaceClient } from "@/components/decision/workspace-client";

export const metadata = { title: "Workspace" };

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const decision = DecisionService.get(id);
  if (!decision || decision.organisationId !== session.organisationId) notFound();

  const requirement = RequirementService.getByDecision(id);
  if (!requirement) redirect(`/decisions/new`);

  await DecisionService.rescoreAll(id);
  const criteria = CriteriaService.list(id);
  const shortlist = DecisionService.getShortlist(id);
  const vendors = await Promise.all(shortlist.map((dv) => VendorService.get(dv.vendorId)));
  const shortlistWithVendors = shortlist
    .map((dv, i) => ({ dv, vendor: vendors[i]! }))
    .filter((x) => x.vendor)
    .sort((a, b) => (b.dv.score?.overallScore || 0) - (a.dv.score?.overallScore || 0));

  const allVendorsInCategory = await VendorService.byCategory(requirement.category as never).catch(() => []);
  const members = CollaborationService.listMembers(id);
  const comments = CollaborationService.listComments(id);
  const notes = CollaborationService.listNotes(id);
  const votesByVendor = Object.fromEntries(shortlist.map((dv) => [dv.vendorId, CollaborationService.voteSummary(id, dv.vendorId)]));

  return (
    <div>
      <Topbar title={decision.name} fullName={session.fullName} subtitle={`${decision.category} · Owned by ${decision.ownerName}`} />
      <div className="p-4 lg:p-8">
        <WorkspaceClient
          decision={decision}
          requirement={requirement}
          criteria={criteria}
          shortlist={shortlistWithVendors}
          availableVendors={allVendorsInCategory}
          members={members}
          comments={comments}
          notes={notes}
          votesByVendor={votesByVendor}
          currentUser={{ id: session.userId, name: session.fullName }}
        />
      </div>
    </div>
  );
}
