# MATCHIQ — Supabase production schema

This directory is the production database design MATCHIQ's demo-mode
in-memory store (`/src/lib/store/db.ts`) is deliberately modelled on, field
for field. Nothing in `/src/types/index.ts` should drift from `schema.sql`
without updating both.

## Files

- `schema.sql` — full table definitions, foreign keys, indexes, and
  `updated_at` triggers.
- `rls.sql` — Row Level Security policies. Enforces organisation-scoped
  access on every table except the vendor catalogue, which is public read
  (matches the product requirement that anyone can browse vendors, but only
  authenticated organisation members can create decisions, save vendors,
  build criteria, collaborate, or generate reports).

## Setting up a real deployment

1. Create a Supabase project.
2. Run `schema.sql` in the SQL editor (or via `supabase db push`).
3. Run `rls.sql`.
4. Seed the `vendors` table — either import the same synthetic catalogue
   MATCHIQ ships with (`src/lib/demo-data/vendors.ts`, converted to SQL
   inserts) or point a real `ExternalApiAdapter` / `CsvVendorAdapter` at it
   (see `/src/lib/adapters`).
5. Set these environment variables (see root `README.md` for the full list):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, used by AnalyticsService/
     AIService to write usage records that bypass RLS by design)
6. Swap the demo auth calls in `/src/lib/auth.ts` for
   `createSupabaseServerClient()` (already scaffolded in
   `/src/lib/supabase/server.ts`) and point `getSession()` at
   `supabase.auth.getUser()` plus a `profiles` lookup instead of the demo
   cookie.
7. Swap every direct `db.*` array read/write in `/src/lib/services/*` for the
   equivalent Supabase query. The service method signatures were kept
   framework-agnostic specifically so this is a mechanical swap, not a
   redesign — no page or API route needs to change.

## Why demo mode uses an in-memory store instead

This portfolio build needed to be runnable and demonstrably correct (real
scoring math, real requirement extraction, real report generation) without
requiring a reviewer to provision a database or an OpenAI key. The in-memory
store is seeded on server start from `src/lib/demo-data/scenarios.ts` and
mirrors this schema exactly, so migrating to Supabase is a data-layer swap,
not an application rewrite.
