import { nowIso } from "@/lib/store/ids";
import { ScoringService } from "@/lib/services/ScoringService";
import {
  CriteriaImportance,
  Decision,
  DecisionCriterion,
  DecisionRequirement,
  DecisionStatus,
  Vendor,
  VendorCategory,
} from "@/types";
import type { Database } from "@/lib/store/db";

const DAY = 86400000;
const isoDaysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();

// Deterministic (non-random) id generator used ONLY for seed data. Every
// server cold start re-seeds identical rows with identical ids — critical
// on serverless platforms like Vercel, where each function instance holds
// its own copy of this in-memory store. Runtime user actions still use the
// random seedId() from ids.ts; only the baseline demo data needs to be
// reproducible across instances.
const seedCounters: Record<string, number> = {};
function seedId(prefix: string): string {
  seedCounters[prefix] = (seedCounters[prefix] ?? 0) + 1;
  return `${prefix}_seed_${seedCounters[prefix]}`;
}

interface ScenarioSpec {
  name: string;
  category: VendorCategory;
  status: DecisionStatus;
  daysAgo: number;
  rawInput: string;
  companySize: number;
  budgetMin: number;
  budgetMax: number;
  requiredFeatures: string[];
  preferredFeatures: string[];
  priorities: string[];
  integrationRequirements: string[];
  criteria: { name: string; weight: number; importance: CriteriaImportance }[];
  shortlistCount: number;
  decided: boolean;
}

const SCENARIOS: ScenarioSpec[] = [
  {
    name: "CRM Platform Selection",
    category: "CRM",
    status: "final_review",
    daysAgo: 0,
    rawInput:
      "We are a 30-person marketing agency looking for CRM software. We need pipeline management, automated email workflows, reporting, Slack integration and strong onboarding. Our budget is around £500 per month.",
    companySize: 30,
    budgetMin: 300,
    budgetMax: 500,
    requiredFeatures: ["pipeline management", "email automation", "reporting", "slack integration"],
    preferredFeatures: ["mobile app", "lead scoring"],
    priorities: ["ease of adoption", "automation", "reporting"],
    integrationRequirements: ["Slack"],
    criteria: [
      { name: "Price", weight: 20, importance: "important" },
      { name: "Automation", weight: 25, importance: "important" },
      { name: "Ease of use", weight: 20, importance: "important" },
      { name: "Integrations", weight: 15, importance: "important" },
      { name: "Reporting", weight: 20, importance: "optional" },
    ],
    shortlistCount: 5,
    decided: false,
  },
  {
    name: "Project Management Selection",
    category: "Project Management",
    status: "shortlisted",
    daysAgo: 1,
    rawInput:
      "We're a 45-person product studio evaluating project management tools. We need kanban boards, sprint planning, time tracking and client portals. Budget roughly £400 a month, and it must integrate with Slack and GitHub.",
    companySize: 45,
    budgetMin: 250,
    budgetMax: 400,
    requiredFeatures: ["kanban boards", "sprint planning", "time tracking"],
    preferredFeatures: ["client portals"],
    priorities: ["automation", "integrations"],
    integrationRequirements: ["Slack", "GitHub"],
    criteria: [
      { name: "Functionality", weight: 25, importance: "important" },
      { name: "Price", weight: 20, importance: "important" },
      { name: "Integrations", weight: 20, importance: "important" },
      { name: "Ease of use", weight: 20, importance: "optional" },
      { name: "Support", weight: 15, importance: "optional" },
    ],
    shortlistCount: 4,
    decided: false,
  },
  {
    name: "Accounting Software Selection",
    category: "Accounting",
    status: "decided",
    daysAgo: 12,
    rawInput:
      "60-person consultancy replacing our accounting software. Need multi-currency invoicing, bank reconciliation, tax reporting and approval workflows. Budget is £150 to £250 per month.",
    companySize: 60,
    budgetMin: 150,
    budgetMax: 250,
    requiredFeatures: ["invoicing", "multi-currency"],
    preferredFeatures: ["expense tracking"],
    priorities: ["cost", "security"],
    integrationRequirements: [],
    criteria: [
      { name: "Price", weight: 30, importance: "required" },
      { name: "Functionality", weight: 25, importance: "important" },
      { name: "Security", weight: 20, importance: "important" },
      { name: "Support", weight: 15, importance: "optional" },
      { name: "Implementation speed", weight: 10, importance: "optional" },
    ],
    shortlistCount: 4,
    decided: true,
  },
  {
    name: "HR Platform Selection",
    category: "HR",
    status: "researching",
    daysAgo: 2,
    rawInput:
      "80-employee scale-up needs an HR platform covering applicant tracking, onboarding workflows, performance reviews and time-off management. Budget around £600/month for the whole team.",
    companySize: 80,
    budgetMin: 400,
    budgetMax: 600,
    requiredFeatures: ["applicant tracking", "onboarding", "performance reviews"],
    preferredFeatures: ["benefits administration"],
    priorities: ["ease of adoption", "scalability"],
    integrationRequirements: ["Google Workspace"],
    criteria: [
      { name: "Functionality", weight: 25, importance: "important" },
      { name: "Ease of use", weight: 20, importance: "important" },
      { name: "Price", weight: 20, importance: "important" },
      { name: "Security", weight: 20, importance: "important" },
      { name: "Support", weight: 15, importance: "optional" },
    ],
    shortlistCount: 6,
    decided: false,
  },
  {
    name: "Customer Support Platform Selection",
    category: "Customer Support",
    status: "decided",
    daysAgo: 20,
    rawInput:
      "35-person e-commerce brand needs a customer support platform with shared inbox, live chat, ticketing and SLA management. Budget £300/month, must integrate with Shopify.",
    companySize: 35,
    budgetMin: 200,
    budgetMax: 300,
    requiredFeatures: ["live chat", "ticketing", "sla management"],
    preferredFeatures: ["knowledge base"],
    priorities: ["automation", "cost"],
    integrationRequirements: ["Shopify"],
    criteria: [
      { name: "Price", weight: 25, importance: "important" },
      { name: "Automation", weight: 25, importance: "important" },
      { name: "Integrations", weight: 20, importance: "important" },
      { name: "Support", weight: 15, importance: "optional" },
      { name: "Ease of use", weight: 15, importance: "optional" },
    ],
    shortlistCount: 3,
    decided: true,
  },
];

export function buildDemoScenarios(db: Database) {
  const org = { id: "org_visuioration_demo", name: "Northfield & Co", slug: "northfield-co", createdAt: isoDaysAgo(180) };
  db.organisations.push(org);

  const owner = { id: "user_demo_owner", organisationId: org.id, email: "amelia@northfieldco.example", fullName: "Amelia Novak", jobTitle: "Head of Operations", avatarColor: "#0F172A", createdAt: isoDaysAgo(180) };
  const reviewer1 = { id: "user_demo_reviewer1", organisationId: org.id, email: "daniel@northfieldco.example", fullName: "Daniel Osei", jobTitle: "Finance Manager", avatarColor: "#1FB6A6", createdAt: isoDaysAgo(170) };
  const reviewer2 = { id: "user_demo_reviewer2", organisationId: org.id, email: "priya@northfieldco.example", fullName: "Priya Chandran", jobTitle: "IT Lead", avatarColor: "#D97706", createdAt: isoDaysAgo(160) };
  db.profiles.push(owner, reviewer1, reviewer2);
  db.organisationMembers.push(
    { id: seedId("om"), organisationId: org.id, userId: owner.id, role: "owner", createdAt: owner.createdAt },
    { id: seedId("om"), organisationId: org.id, userId: reviewer1.id, role: "admin", createdAt: reviewer1.createdAt },
    { id: seedId("om"), organisationId: org.id, userId: reviewer2.id, role: "member", createdAt: reviewer2.createdAt }
  );

  const vendorsByCategory: Record<string, Vendor[]> = {};
  for (const v of db.vendors) {
    (vendorsByCategory[v.category] ||= []).push(v);
  }

  for (const spec of SCENARIOS) {
    const decision: Decision = {
      id: seedId("dec"),
      organisationId: org.id,
      name: spec.name,
      category: spec.category,
      status: spec.status,
      ownerId: owner.id,
      ownerName: owner.fullName,
      createdAt: isoDaysAgo(spec.daysAgo + 6),
      updatedAt: isoDaysAgo(spec.daysAgo),
    };
    db.decisions.push(decision);
    db.members.push(
      { id: seedId("mem"), decisionId: decision.id, userId: owner.id, userName: owner.fullName, role: "owner", addedAt: decision.createdAt },
      { id: seedId("mem"), decisionId: decision.id, userId: reviewer1.id, userName: reviewer1.fullName, role: "reviewer", addedAt: decision.createdAt },
      { id: seedId("mem"), decisionId: decision.id, userId: reviewer2.id, userName: reviewer2.fullName, role: "reviewer", addedAt: decision.createdAt }
    );

    const requirement: DecisionRequirement = {
      id: seedId("req"),
      decisionId: decision.id,
      rawInput: spec.rawInput,
      category: spec.category,
      companySize: spec.companySize,
      budgetMin: spec.budgetMin,
      budgetMax: spec.budgetMax,
      currency: "GBP",
      billingFrequency: "monthly",
      requiredFeatures: spec.requiredFeatures,
      preferredFeatures: spec.preferredFeatures,
      excludedFeatures: [],
      priorities: spec.priorities,
      constraints: [],
      integrationRequirements: spec.integrationRequirements,
      securityRequirements: [],
      implementationPreference: "guided_onboarding",
      extra: { extractionConfidence: 0.86, extractionSource: "demo-fallback" },
      createdAt: decision.createdAt,
      updatedAt: decision.createdAt,
    };
    db.requirements.push(requirement);

    const criteria: DecisionCriterion[] = spec.criteria.map((c, i) => ({
      id: seedId("crit"),
      decisionId: decision.id,
      name: c.name,
      weight: c.weight,
      importance: c.importance,
      order: i,
    }));
    db.criteria.push(...criteria);

    const candidates = (vendorsByCategory[spec.category] || []).slice(0, spec.shortlistCount);
    const categoryPrices = (vendorsByCategory[spec.category] || []).map((v) => v.startingPrice);

    candidates.forEach((vendor, idx) => {
      const score = ScoringService.computeVendorScore(vendor, requirement, criteria, { categoryPrices });
      db.decisionVendors.push({
        id: seedId("dv"),
        decisionId: decision.id,
        vendorId: vendor.id,
        shortlisted: true,
        rank: idx + 1,
        score,
        addedAt: decision.createdAt,
      });
    });

    // Sort shortlist by score desc for consistent ranking
    const decVendors = db.decisionVendors.filter((dv) => dv.decisionId === decision.id);
    decVendors.sort((a, b) => (b.score?.overallScore || 0) - (a.score?.overallScore || 0));
    decVendors.forEach((dv, i) => (dv.rank = i + 1));

    const top = decVendors[0];
    const second = decVendors[1];

    if (top) {
      db.comments.push({
        id: seedId("cmt"),
        decisionId: decision.id,
        vendorId: top.vendorId,
        authorId: reviewer1.id,
        authorName: reviewer1.fullName,
        body: `This is scoring well on our must-haves — worth a demo call before we shortlist further. @${reviewer2.fullName}`,
        mentions: [reviewer2.fullName],
        createdAt: isoDaysAgo(spec.daysAgo + 1),
      });
      db.votes.push(
        { id: seedId("vote"), decisionId: decision.id, vendorId: top.vendorId, voterId: reviewer1.id, voterName: reviewer1.fullName, value: "strong_choice", createdAt: isoDaysAgo(spec.daysAgo + 1) },
        { id: seedId("vote"), decisionId: decision.id, vendorId: top.vendorId, voterId: reviewer2.id, voterName: reviewer2.fullName, value: "strong_choice", createdAt: isoDaysAgo(spec.daysAgo) }
      );
      db.notes.push({
        id: seedId("note"),
        decisionId: decision.id,
        vendorId: top.vendorId,
        type: "pro",
        body: "Strong match against our required capabilities and comfortably inside budget.",
        authorId: owner.id,
        authorName: owner.fullName,
        createdAt: isoDaysAgo(spec.daysAgo + 1),
      });
    }
    if (second) {
      db.votes.push({ id: seedId("vote"), decisionId: decision.id, vendorId: second.vendorId, voterId: reviewer1.id, voterName: reviewer1.fullName, value: "acceptable", createdAt: isoDaysAgo(spec.daysAgo) });
      db.notes.push({
        id: seedId("note"),
        decisionId: decision.id,
        vendorId: second.vendorId,
        type: "concern",
        body: "Solid alternative, but implementation timeline runs longer than we'd like.",
        authorId: reviewer2.id,
        authorName: reviewer2.fullName,
        createdAt: isoDaysAgo(spec.daysAgo),
      });
    }

    if (spec.decided && top) {
      decision.selectedVendorId = top.vendorId;
      decision.rationale = `Selected because it provides the best combination of ${spec.priorities.join(", ")} within our budget of £${spec.budgetMax}/month.`;
      decision.decisionDate = isoDaysAgo(spec.daysAgo);
      db.reports.push({
        id: seedId("rpt"),
        decisionId: decision.id,
        generatedAt: isoDaysAgo(spec.daysAgo),
        generatedBy: owner.fullName,
        snapshot: { note: "Generated automatically when the report is viewed." },
      });
    }

    // Backfill analytics events so the dashboard/admin views feel populated.
    const events: [string, number][] = [
      ["decision_created", spec.daysAgo + 6],
      ["requirement_submitted", spec.daysAgo + 6],
      ["requirement_extracted", spec.daysAgo + 6],
      ["clarification_started", spec.daysAgo + 6],
      ["clarification_answered", spec.daysAgo + 5],
      ["criteria_created", spec.daysAgo + 5],
      ["vendor_shortlisted", spec.daysAgo + 4],
      ["comparison_started", spec.daysAgo + 3],
      ["comparison_completed", spec.daysAgo + 3],
      ["comment_created", spec.daysAgo + 1],
      ["vote_created", spec.daysAgo + 1],
    ];
    if (spec.decided) events.push(["decision_completed", spec.daysAgo], ["report_generated", spec.daysAgo]);
    for (const [type, days] of events) {
      db.analyticsEvents.push({ id: seedId("evt"), organisationId: org.id, userId: owner.id, type: type as never, metadata: { decisionId: decision.id }, createdAt: isoDaysAgo(days) });
      db.aiUsage.push({
        id: seedId("aiu"),
        organisationId: org.id,
        provider: "demo-fallback",
        operation: "requirement_extraction",
        success: true,
        estimatedTokens: 280,
        estimatedCostUsd: 0,
        latencyMs: 340,
        createdAt: isoDaysAgo(days),
      });
    }
  }

  db.analyticsEvents.push({ id: seedId("evt"), organisationId: org.id, userId: owner.id, type: "account_created", metadata: {}, createdAt: isoDaysAgo(180) });
}
