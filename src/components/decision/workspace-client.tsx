"use client";
import Link from "next/link";
import {
  Decision, DecisionRequirement, DecisionCriterion, DecisionVendor, Vendor,
  DecisionMember, DecisionComment, DecisionNote,
} from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusStepper } from "./status-stepper";
import { CriteriaBuilder } from "./criteria-builder";
import { ShortlistPanel } from "./shortlist-panel";
import { CollaborationPanel } from "./collaboration-panel";
import { FinalisePanel } from "./finalise-panel";
import { formatDate } from "@/lib/utils";
import { BarChart3, ArrowRight } from "lucide-react";

export function WorkspaceClient({
  decision,
  requirement,
  criteria,
  shortlist,
  availableVendors,
  members,
  comments,
  notes,
  votesByVendor,
}: {
  decision: Decision;
  requirement: DecisionRequirement;
  criteria: DecisionCriterion[];
  shortlist: { dv: DecisionVendor; vendor: Vendor }[];
  availableVendors: Vendor[];
  members: DecisionMember[];
  comments: DecisionComment[];
  notes: DecisionNote[];
  votesByVendor: Record<string, { strong_choice: number; acceptable: number; not_suitable: number; total: number }>;
  currentUser: { id: string; name: string };
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <StatusStepper decisionId={decision.id} status={decision.status} />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="criteria">Criteria</TabsTrigger>
            <TabsTrigger value="shortlist">Shortlist &amp; scoring</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="decide">Decide</TabsTrigger>
          </TabsList>
          {shortlist.length >= 2 && (
            <Link href={`/compare?ids=${shortlist.map((s) => s.vendor.id).join(",")}&decisionId=${decision.id}`}>
              <Button size="sm" variant="outline"><BarChart3 className="h-3.5 w-3.5" /> Compare shortlist</Button>
            </Link>
          )}
          {shortlist.length > 0 && (
            <Link href={`/decisions/${decision.id}`}>
              <Button size="sm">View results <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          )}
        </div>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Original requirement</p>
              <p className="text-sm text-slate-700 italic">&ldquo;{requirement.rawInput}&rdquo;</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline">{requirement.category}</Badge>
                {requirement.companySize && <Badge variant="outline">{requirement.companySize} employees</Badge>}
                {requirement.budgetMax && <Badge variant="outline">Budget £{requirement.budgetMin ?? 0}-{requirement.budgetMax}/mo</Badge>}
                <Badge variant="outline">{requirement.implementationPreference.replaceAll("_", " ")}</Badge>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <RequirementList title="Required features" items={requirement.requiredFeatures} />
                <RequirementList title="Preferred features" items={requirement.preferredFeatures} />
                <RequirementList title="Integrations needed" items={requirement.integrationRequirements} />
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-slate-400">Created {formatDate(decision.createdAt)} · Last updated {formatDate(decision.updatedAt)}</p>
        </TabsContent>

        <TabsContent value="criteria" className="mt-4">
          <CriteriaBuilder decisionId={decision.id} criteria={criteria} />
        </TabsContent>

        <TabsContent value="shortlist" className="mt-4">
          <ShortlistPanel decisionId={decision.id} shortlist={shortlist} availableVendors={availableVendors} votesByVendor={votesByVendor} />
        </TabsContent>

        <TabsContent value="collaboration" className="mt-4">
          <CollaborationPanel decisionId={decision.id} comments={comments} notes={notes} members={members} />
        </TabsContent>

        <TabsContent value="decide" className="mt-4">
          <FinalisePanel decisionId={decision.id} shortlist={shortlist} selectedVendorId={decision.selectedVendorId} rationale={decision.rationale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequirementList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">None specified</p>
      ) : (
        <ul className="space-y-1">
          {items.map((f) => <li key={f} className="text-xs text-slate-700">• {f}</li>)}
        </ul>
      )}
    </div>
  );
}
