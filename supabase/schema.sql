-- MATCHIQ production schema (PostgreSQL / Supabase).
-- This is the schema the demo build's in-memory store mirrors field-for-field
-- (see /src/types/index.ts). Run this against a fresh Supabase project, then
-- apply rls.sql, then seed.sql if you want the same demo scenarios loaded.

create extension if not exists "pgcrypto";

-- ========== Identity & organisations ==========

create table organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table organisation_members (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references organisations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              text not null check (role in ('owner','admin','member')),
  created_at        timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  organisation_id   uuid not null references organisations(id) on delete cascade,
  email             text not null,
  full_name         text not null,
  job_title         text,
  avatar_color      text not null default '#14213d',
  created_at        timestamptz not null default now()
);

-- ========== Vendor catalogue ==========
-- Populated by StaticDemoAdapter's seed data, an ExternalApiAdapter sync, or
-- a CsvVendorAdapter import — see /src/lib/adapters. The `is_demo_data` flag
-- must be preserved end-to-end so the UI can always label synthetic rows.

create table vendors (
  id                    text primary key,
  name                  text not null,
  category              text not null,
  description           text not null,
  pricing_model         text not null check (pricing_model in ('per_seat','flat','usage_based','tiered')),
  starting_price        numeric not null,
  currency              text not null default 'GBP',
  rating                numeric not null check (rating >= 0 and rating <= 5),
  review_count          integer not null default 0,
  company_size          text not null,
  features              text[] not null default '{}',
  integrations          text[] not null default '{}',
  security_features     text[] not null default '{}',
  implementation_time   text not null,
  implementation_days   integer not null,
  support_level         text not null check (support_level in ('self_serve','business_hours','24_7','dedicated_csm')),
  deployment_type       text not null check (deployment_type in ('cloud','on_premise','hybrid')),
  website               text,
  logo                  text,
  is_demo_data          boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_vendors_category on vendors(category);
create index idx_vendors_price on vendors(starting_price);

create table vendor_features (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   text not null references vendors(id) on delete cascade,
  name        text not null,
  category    text not null default 'other'
);

create table vendor_integrations (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   text not null references vendors(id) on delete cascade,
  name        text not null
);

-- ========== Decisions ==========

create table decisions (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisations(id) on delete cascade,
  name                text not null,
  category            text not null,
  status              text not null default 'draft' check (status in ('draft','researching','shortlisted','final_review','decided')),
  owner_id            uuid not null references auth.users(id),
  selected_vendor_id  text references vendors(id),
  rationale           text,
  decision_date       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_decisions_org on decisions(organisation_id);
create index idx_decisions_status on decisions(status);

create table decision_requirements (
  id                          uuid primary key default gen_random_uuid(),
  decision_id                 uuid not null unique references decisions(id) on delete cascade,
  raw_input                   text not null,
  category                    text not null,
  industry                    text,
  company_size                integer,
  budget_min                  numeric,
  budget_max                  numeric,
  currency                    text not null default 'GBP',
  billing_frequency           text not null default 'monthly' check (billing_frequency in ('monthly','annual','one_time')),
  required_features           text[] not null default '{}',
  preferred_features          text[] not null default '{}',
  excluded_features           text[] not null default '{}',
  priorities                  text[] not null default '{}',
  constraints                 text[] not null default '{}',
  integration_requirements    text[] not null default '{}',
  security_requirements       text[] not null default '{}',
  implementation_preference   text not null default 'guided_onboarding',
  extra                       jsonb not null default '{}',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create table clarification_questions (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  question      text not null,
  options       text[] not null default '{}',
  rationale     text,
  "order"       integer not null default 0
);

create table clarification_answers (
  id             uuid primary key default gen_random_uuid(),
  decision_id    uuid not null references decisions(id) on delete cascade,
  question_id    uuid not null references clarification_questions(id) on delete cascade,
  answer         text not null,
  created_at     timestamptz not null default now()
);

create table decision_criteria (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  name          text not null,
  description   text,
  weight        numeric not null default 0,
  importance    text not null default 'important' check (importance in ('required','important','optional')),
  "order"       integer not null default 0
);

create index idx_criteria_decision on decision_criteria(decision_id);

create table decision_vendors (
  id              uuid primary key default gen_random_uuid(),
  decision_id     uuid not null references decisions(id) on delete cascade,
  vendor_id       text not null references vendors(id),
  shortlisted     boolean not null default true,
  rank            integer,
  added_at        timestamptz not null default now(),
  unique (decision_id, vendor_id)
);

create table vendor_scores (
  id                      uuid primary key default gen_random_uuid(),
  decision_vendor_id      uuid not null unique references decision_vendors(id) on delete cascade,
  price_score             numeric not null,
  feature_score           numeric not null,
  integration_score       numeric not null,
  usability_score         numeric not null,
  security_score          numeric not null,
  support_score           numeric not null,
  implementation_score    numeric not null,
  value_score             numeric not null,
  overall_score           numeric not null,
  criteria_contributions  jsonb not null default '[]',
  evaluated_capabilities  integer not null default 0,
  evaluated_criteria      integer not null default 0,
  computed_at             timestamptz not null default now()
);

-- ========== Collaboration ==========

create table decision_comments (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  vendor_id     text references vendors(id),
  author_id     uuid not null references auth.users(id),
  body          text not null,
  mentions      text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create table decision_votes (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  vendor_id     text not null references vendors(id),
  voter_id      uuid not null references auth.users(id),
  value         text not null check (value in ('strong_choice','acceptable','not_suitable')),
  created_at    timestamptz not null default now(),
  unique (decision_id, vendor_id, voter_id)
);

create table decision_notes (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  vendor_id     text references vendors(id),
  type          text not null check (type in ('pro','concern','question','implementation')),
  body          text not null,
  author_id     uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);

create table decision_members (
  id            uuid primary key default gen_random_uuid(),
  decision_id   uuid not null references decisions(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  role          text not null default 'member' check (role in ('owner','reviewer','member')),
  added_at      timestamptz not null default now(),
  unique (decision_id, user_id)
);

create table decision_reports (
  id             uuid primary key default gen_random_uuid(),
  decision_id    uuid not null references decisions(id) on delete cascade,
  generated_at   timestamptz not null default now(),
  generated_by   uuid not null references auth.users(id),
  snapshot       jsonb not null
);

-- ========== Analytics & AI usage ==========

create table analytics_events (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references organisations(id) on delete cascade,
  user_id            uuid references auth.users(id),
  type               text not null,
  metadata           jsonb not null default '{}',
  created_at         timestamptz not null default now()
);

create index idx_events_org_type on analytics_events(organisation_id, type);
create index idx_events_created on analytics_events(created_at);

create table ai_usage (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid not null references organisations(id) on delete cascade,
  provider              text not null check (provider in ('openai','demo-fallback')),
  operation             text not null,
  success               boolean not null,
  estimated_tokens      integer not null default 0,
  estimated_cost_usd    numeric not null default 0,
  latency_ms            integer not null default 0,
  created_at            timestamptz not null default now()
);

create index idx_ai_usage_org on ai_usage(organisation_id);

-- ========== updated_at triggers ==========

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_decisions_updated before update on decisions
  for each row execute function set_updated_at();

create trigger trg_requirements_updated before update on decision_requirements
  for each row execute function set_updated_at();

create trigger trg_vendors_updated before update on vendors
  for each row execute function set_updated_at();
