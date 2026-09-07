// MATCHIQ core domain types.
// Mirrors the PostgreSQL schema in /supabase/schema.sql so the in-memory
// demo store and a future Supabase-backed store share one contract.

export type ID = string;

export type BillingFrequency = "monthly" | "annual" | "one_time";

export type ImplementationPreference =
  | "self_serve"
  | "guided_onboarding"
  | "white_glove";

export type PriorityLevel = "essential" | "important" | "nice_to_have";

export type DecisionStatus =
  | "draft"
  | "researching"
  | "shortlisted"
  | "final_review"
  | "decided";

export type CriteriaImportance = "required" | "important" | "optional";

export type VoteValue = "strong_choice" | "acceptable" | "not_suitable";

export type NoteType = "pro" | "concern" | "question" | "implementation";

export type VendorCategory =
  | "CRM"
  | "Project Management"
  | "Accounting"
  | "HR"
  | "Marketing Automation"
  | "Customer Support"
  | "Analytics"
  | "Cybersecurity"
  | "Communication"
  | "Document Management";

export type DeploymentType = "cloud" | "on_premise" | "hybrid";

export type SupportLevel = "self_serve" | "business_hours" | "24_7" | "dedicated_csm";

export interface Organisation {
  id: ID;
  name: string;
  slug: string;
  createdAt: string;
}

export interface OrganisationMember {
  id: ID;
  organisationId: ID;
  userId: ID;
  role: "owner" | "admin" | "member";
  createdAt: string;
}

export interface Profile {
  id: ID;
  organisationId: ID;
  email: string;
  fullName: string;
  jobTitle?: string;
  avatarColor: string;
  createdAt: string;
}

/** Structured, extensible business requirement extracted from free text. */
export interface DecisionRequirement {
  id: ID;
  decisionId: ID;
  rawInput: string;
  category: VendorCategory | string;
  industry?: string;
  companySize?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  billingFrequency: BillingFrequency;
  requiredFeatures: string[];
  preferredFeatures: string[];
  excludedFeatures: string[];
  priorities: string[];
  constraints: string[];
  integrationRequirements: string[];
  securityRequirements: string[];
  implementationPreference: ImplementationPreference;
  extra?: Record<string, unknown>; // extensibility escape hatch
  createdAt: string;
  updatedAt: string;
}

export interface ClarificationQuestion {
  id: ID;
  decisionId: ID;
  question: string;
  options: string[];
  rationale: string;
  order: number;
}

export interface ClarificationAnswer {
  id: ID;
  decisionId: ID;
  questionId: ID;
  answer: string;
  createdAt: string;
}

export interface DecisionCriterion {
  id: ID;
  decisionId: ID;
  name: string;
  description?: string;
  weight: number; // normalised 0-100, sums to 100 across a decision
  importance: CriteriaImportance;
  order: number;
}

export interface VendorFeature {
  name: string;
  category: "core" | "automation" | "reporting" | "collaboration" | "other";
}

export interface Vendor {
  id: ID;
  name: string;
  category: VendorCategory;
  description: string;
  pricingModel: "per_seat" | "flat" | "usage_based" | "tiered";
  startingPrice: number;
  currency: string;
  rating: number; // 0-5
  reviewCount: number;
  companySize: string; // e.g. "1-10", "11-50", "51-200", "200+"
  features: string[];
  integrations: string[];
  securityFeatures: string[];
  implementationTime: string; // e.g. "1-2 weeks"
  implementationDays: number; // numeric for scoring
  supportLevel: SupportLevel;
  deploymentType: DeploymentType;
  website: string;
  logo: string; // initials used for a generated mark, demo data
  isDemoData: true;
  createdAt: string;
  updatedAt: string;
}

export interface VendorScoreBreakdown {
  priceScore: number;
  featureScore: number;
  integrationScore: number;
  usabilityScore: number;
  securityScore: number;
  supportScore: number;
  implementationScore: number;
  valueScore: number;
  overallScore: number;
  criteriaContributions: { criterionId: ID; criterionName: string; weight: number; rawScore: number; weighted: number }[];
  evaluatedCapabilities: number;
  evaluatedCriteria: number;
}

export interface DecisionVendor {
  id: ID;
  decisionId: ID;
  vendorId: ID;
  shortlisted: boolean;
  rank?: number;
  score?: VendorScoreBreakdown;
  addedAt: string;
}

export interface DecisionComment {
  id: ID;
  decisionId: ID;
  vendorId?: ID;
  authorId: ID;
  authorName: string;
  body: string;
  mentions: string[];
  createdAt: string;
}

export interface DecisionVote {
  id: ID;
  decisionId: ID;
  vendorId: ID;
  voterId: ID;
  voterName: string;
  value: VoteValue;
  createdAt: string;
}

export interface DecisionNote {
  id: ID;
  decisionId: ID;
  vendorId?: ID;
  type: NoteType;
  body: string;
  authorId: ID;
  authorName: string;
  createdAt: string;
}

export interface DecisionReport {
  id: ID;
  decisionId: ID;
  generatedAt: string;
  generatedBy: string;
  snapshot: Record<string, unknown>; // frozen data used to render the report
}

export interface Decision {
  id: ID;
  organisationId: ID;
  name: string;
  category: VendorCategory | string;
  status: DecisionStatus;
  ownerId: ID;
  ownerName: string;
  selectedVendorId?: ID;
  rationale?: string;
  decisionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionMember {
  id: ID;
  decisionId: ID;
  userId: ID;
  userName: string;
  role: "owner" | "reviewer" | "member";
  addedAt: string;
}

export type AnalyticsEventType =
  | "account_created"
  | "decision_created"
  | "requirement_submitted"
  | "requirement_extracted"
  | "clarification_started"
  | "clarification_answered"
  | "criteria_created"
  | "criteria_weight_changed"
  | "vendor_viewed"
  | "vendor_shortlisted"
  | "comparison_started"
  | "comparison_completed"
  | "vote_created"
  | "comment_created"
  | "decision_completed"
  | "report_generated"
  | "ai_request_started"
  | "ai_request_completed"
  | "ai_request_failed";

export interface AnalyticsEvent {
  id: ID;
  organisationId: ID;
  userId?: ID;
  type: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIUsageRecord {
  id: ID;
  organisationId: ID;
  provider: "openai" | "demo-fallback";
  operation: "requirement_extraction" | "clarification_generation" | "recommendation_explanation";
  success: boolean;
  estimatedTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  createdAt: string;
}
