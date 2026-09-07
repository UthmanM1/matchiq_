import { newId, nowIso } from "./ids";
export { newId, nowIso };
import {
  AIUsageRecord,
  AnalyticsEvent,
  ClarificationAnswer,
  ClarificationQuestion,
  Decision,
  DecisionComment,
  DecisionCriterion,
  DecisionMember,
  DecisionNote,
  DecisionReport,
  DecisionRequirement,
  DecisionVendor,
  DecisionVote,
  Organisation,
  OrganisationMember,
  Profile,
  Vendor,
} from "@/types";
import { DEMO_VENDORS } from "@/lib/demo-data/vendors";
import { buildDemoScenarios } from "@/lib/demo-data/scenarios";

export interface Database {
  organisations: Organisation[];
  organisationMembers: OrganisationMember[];
  profiles: Profile[];
  vendors: Vendor[];
  decisions: Decision[];
  requirements: DecisionRequirement[];
  clarificationQuestions: ClarificationQuestion[];
  clarificationAnswers: ClarificationAnswer[];
  criteria: DecisionCriterion[];
  decisionVendors: DecisionVendor[];
  comments: DecisionComment[];
  votes: DecisionVote[];
  notes: DecisionNote[];
  reports: DecisionReport[];
  members: DecisionMember[];
  analyticsEvents: AnalyticsEvent[];
  aiUsage: AIUsageRecord[];
}

function seed(): Database {
  const db: Database = {
    organisations: [],
    organisationMembers: [],
    profiles: [],
    vendors: DEMO_VENDORS,
    decisions: [],
    requirements: [],
    clarificationQuestions: [],
    clarificationAnswers: [],
    criteria: [],
    decisionVendors: [],
    comments: [],
    votes: [],
    notes: [],
    reports: [],
    members: [],
    analyticsEvents: [],
    aiUsage: [],
  };
  buildDemoScenarios(db);
  return db;
}

// Persist across Next.js dev hot-reloads / route-handler module reloads.
const g = globalThis as unknown as { __matchiqDb?: Database };
export const db: Database = g.__matchiqDb ?? (g.__matchiqDb = seed());

export function resetDatabase() {
  g.__matchiqDb = seed();
  return g.__matchiqDb;
}
