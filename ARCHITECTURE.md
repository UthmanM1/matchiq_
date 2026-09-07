# MATCHIQ Architecture

## System overview

MATCHIQ is a Next.js 16 App Router application. Server Components fetch data
directly from a service layer (no client-side data-fetching library); Client
Components handle interactivity (sliders, forms, tabs) and talk back to the
server exclusively through a set of REST-ish Route Handlers under `/api`.
There is no separate backend process — the "backend" is the service layer in
`src/lib/services`, callable directly from Server Components and from Route
Handlers.

```
Browser
  │
  ├─ Server Components (pages)  ──────►  services/*  ──────►  store/db.ts (demo)
  │                                                       or  Supabase (production)
  └─ Client Components  ──fetch──►  /api/**/route.ts  ──►  services/*  ──► store
```

This split exists so the demo→production migration touches exactly one
layer: swap what's inside `store/db.ts` reads/writes for Supabase queries,
and nothing above the service layer changes.

## Database

`src/types/index.ts` is the single source of truth for every domain shape,
and `supabase/schema.sql` mirrors it table-for-table. The demo build's
`src/lib/store/db.ts` holds the same shapes in a plain in-memory object,
persisted across Next.js dev hot-reloads via `globalThis` so state survives
a code change but resets on a full server restart.

Seeding happens once, in `src/lib/demo-data/scenarios.ts`, which creates:

- One organisation ("Northfield & Co") with three profiles (an owner and two
  reviewers).
- Five decisions spanning every status in the lifecycle (`draft` →
  `researching` → `shortlisted` → `final_review` → `decided`), each with a
  realistic free-text requirement, extracted structured fields, a criteria
  set with real weights, a shortlist of vendors with real computed scores,
  comments, votes, and structured notes.
- A trail of `analytics_events` and `ai_usage` rows backdated across the last
  few weeks so the dashboard and admin views aren't empty on first load.

## Requirement extraction

`RequirementService.submitRawInput` is the entry point (called by the "New
decision" wizard). It:

1. Calls `AIService.extractRequirement(text)`.
2. Persists the returned fields as a `DecisionRequirement`.
3. Calls `AIService.generateClarificationQuestions(extraction)` to produce
   3-5 questions, persisted as `ClarificationQuestion` rows.
4. Logs `requirement_submitted`, `requirement_extracted`,
   `clarification_started`, and `ai_request_started/completed` analytics
   events, plus an `AIUsageRecord`.

### The deterministic fallback extractor

Lives in `AIService.ts` (`fallbackExtraction` and its helpers). It is not a
toy — it's what demo mode always runs, and what production runs whenever a
live model call fails or isn't configured:

- **Category** — scores each of the 10 categories by how many of its
  keyword phrases (`src/lib/demo-data/categories.ts`) appear in the text,
  and picks the highest.
- **Company size** — regex for a number followed by
  person/people/employee(s)/staff/FTE.
- **Budget** — regex for a currency symbol, an optional "k" multiplier, and
  a monthly/annual frequency word; sets `budgetMin` to 60% of the detected
  figure as a reasonable floor and `budgetMax` to the figure itself.
- **Required features** — literal substring match against a curated feature
  keyword list, plus a small synonym table (e.g. "automated email
  workflows" → "email automation") so paraphrased requests still register.
- **Integrations** — literal match against a list of well-known tool names.
- **Priorities** — literal match against a priority-keyword list, defaulting
  to "Balanced fit" if none are mentioned.

### Clarification questions

Template-based, not model-generated, because the useful question set for
"what would change this score" is small and known in advance:
implementation urgency, automation importance, budget (only if not already
stated), cost-vs-functionality trade-off, and required integrations (only if
none were detected). Capped at 5. Answers are folded back into the stored
requirement by `RequirementService.recordAnswer` — e.g. answering "Essential"
to the implementation question sets `implementationPreference: "self_serve"`,
which then actually changes `ScoringService`'s `implementationScore`.

## Scoring engine

`ScoringService.computeVendorScore(vendor, requirement, criteria, ctx)` is
pure — no I/O, no randomness, no AI call — and returns a `VendorScoreBreakdown`.

### The eight dimensions

| Dimension | How it's computed |
|---|---|
| `priceScore` | If a budget is set: position within budget, or a steep penalty scaled by how far over budget the vendor is. If no budget: position within the observed price range for that category. |
| `featureScore` | Weighted match ratio: 75% required-feature match + 25% preferred-feature match (fuzzy substring matching in both directions), minus a penalty for any excluded feature present. |
| `integrationScore` | Match ratio against `integrationRequirements`, or a density-based baseline if none were specified. |
| `securityScore` | Match ratio against `securityRequirements`, or a density-based baseline. |
| `usabilityScore` | Directly derived from the vendor's star rating (0-5 → 0-100). |
| `supportScore` | Fixed lookup table by support tier (`self_serve` 55 → `dedicated_csm` 97). |
| `implementationScore` | Inverse of implementation days, with small bonuses when the vendor's support model matches the requirement's stated implementation preference. |
| `valueScore` | 50% price + 50% feature — a simple, explainable "bang for buck" composite. |

### From dimensions to a single overall score

Every `DecisionCriterion` (whether one of the five seeded defaults or a
custom one a user typed in) is mapped onto exactly one of the eight
dimensions above by keyword regex (`mapCriterionToDimension`). A criterion
that doesn't match any regex — e.g. a bespoke "Data residency" — falls back
to `featureScore`. Each criterion's raw score is then a 70/30 blend of that
dimension's value and a direct keyword-evidence check (`keywordEvidenceScore`):
does any word from the criterion's name appear in the vendor's own features,
integrations, or security-feature strings? This means "Slack integration" as
a named criterion scores meaningfully differently for a vendor that actually
lists Slack versus one that doesn't, even though both would otherwise share
the same `integrationScore`.

The overall score is the weight-normalised sum of every criterion's weighted
contribution — i.e. exactly the number a reader sees broken down in the
recommendation UI and the report, with no hidden adjustment afterward.

### Why this matters

`tests/scoring-service.test.ts` asserts byte-identical output for identical
input across repeated calls, that required-feature matches score higher than
non-matches, that over-budget vendors score lower, and that a shortlist's
rank order is stable. None of this depends on an AI call succeeding, so
scoring is exactly as reliable in demo mode as it would be in production.

## AI architecture

`AIService` is the *only* module allowed to call an external model, and each
of its three responsibilities is scoped to minimise what the model can get
wrong:

1. **`extractRequirement`** — the model (if configured) is asked to return
   compact JSON matching the requirement shape. Its output is merged over
   the deterministic extraction's output as a safety net (if the model omits
   a field or returns malformed JSON, the deterministic value survives).
2. **`generateClarificationQuestions`** — no model call at all; a decision
   tree over the extraction result.
3. **`explainRecommendation`** — given a vendor, a requirement, criteria, and
   an already-computed `VendorScoreBreakdown`, produces 1-2 sentences of
   narration. The prompt explicitly forbids introducing any price, feature,
   integration, or certification not already present in the JSON payload
   it's given, and the fallback template is built the same way (string-
   interpolating only fields already present on `vendor`/`score`). Either
   path also returns a fixed evidence line — "Analysis based on N criteria
   and M evaluated capabilities" — computed directly from the requirement
   and score object, never generated text.

If `OPENAI_API_KEY` is unset, `hasOpenAIConfig()` short-circuits every model
call to `null` before any network request is attempted, and every fallback
path activates automatically. `AIUsageRecord`s tag `provider` as
`"demo-fallback"` in that case, which is what the admin page's AI usage
panel reports on.

## Organisation-level security

Two enforcement layers exist, matched schema-for-schema:

- **Application layer (active today):** every page under `(app)/` requires a
  session (`getSession()` redirects to `/login` if absent); every
  decision-scoped page additionally checks
  `decision.organisationId === session.organisationId` and 404s otherwise;
  every mutating API route calls `requireSession()` before touching the
  store.
- **Database layer (`supabase/rls.sql`, ready for production):** Row Level
  Security policies on every table gate access through
  `organisation_members`, so the boundary holds even if application code has
  a bug. The vendor catalogue is the one table with a public `select`
  policy — matching the product requirement that anyone can browse vendors
  without an account, while every other action requires membership.

## Report generation

`ReportService.generate` assembles a frozen JSON `snapshot` (decision,
requirement, criteria, every shortlisted vendor's score breakdown and
AI-narrated explanation, and vote tallies) and stores it as a
`DecisionReport` row. Snapshotting means a report always reflects the state
at generation time — editing criteria afterward doesn't retroactively change
a report someone already downloaded, matching how a real decision audit
trail should behave.

Two renderers consume the same snapshot:

- `/decisions/[id]/report` — an HTML page styled for print (`@media print`
  rules in `globals.css` hide navigation chrome).
- `/api/decisions/[id]/report/pdf` — a real PDF built server-side with
  `pdfkit`, a pure Node.js library with no headless-browser or native binary
  dependency, so it runs identically in a serverless function.

## Analytics

`AnalyticsService.track(organisationId, userId, type, metadata)` is called
inline from every service method that corresponds to one of the required
event types (all 19 types in the spec are wired: from `account_created`
through `report_generated`). Events are append-only rows, queried by
`AnalyticsService.decisionAnalytics()` (per-organisation dashboard/analytics
numbers) and `AnalyticsService.countByType()` / `recentEvents()` (the admin
cross-organisation view).

## Adapters: swapping the vendor data source

```ts
export interface VendorDataAdapter {
  readonly sourceName: string;
  readonly isDemoData: boolean;
  listVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
}
```

`VendorService` holds a single adapter instance and never reaches into the
store directly for vendor reads. Three implementations exist today:

- `StaticDemoAdapter` — reads the synthetic catalogue from the in-memory
  store. Active by default.
- `ExternalApiAdapter` — a working stub that calls
  `GET {baseUrl}/vendors` / `GET {baseUrl}/vendors/{id}` with a bearer
  token, shaped for a real licensed vendor-data API once one exists. Not
  wired up (no such agreement exists for this portfolio build).
- `CsvVendorAdapter` — parses a client-provided vendor CSV (pipe-delimited
  list columns for features/integrations/security) into the same `Vendor`
  shape.

Because `ScoringService`, `ComparisonService`, and every UI component only
ever see the `Vendor` type — never the adapter — switching the active
adapter in `VendorService.ts` is the entire migration.

## Scaling considerations

- **Scoring is embarrassingly parallel.** Each vendor's score is computed
  independently with no shared mutable state, so scoring a shortlist of
  hundreds of vendors is trivially parallelisable if the catalogue grows.
- **Vendor catalogue growth** is isolated to the adapter layer — moving from
  68 demo vendors to tens of thousands from a real syndicated feed only
  requires the `ExternalApiAdapter` to add pagination/caching; nothing else
  in the app assumes a catalogue size.
- **Analytics/AI usage tables are append-only and organisation-scoped**,
  which partitions cleanly (e.g. by `organisation_id` range or hash) if a
  single Postgres instance becomes a bottleneck.
- **Reports are immutable snapshots**, so report storage/retention can be
  moved to cold storage (e.g. S3 + a pointer row) independently of the live
  decision-editing path without changing how reports are generated or read.
- **The demo → Supabase migration is mechanical, not architectural** — see
  `supabase/README.md` for the exact list of files that change.
