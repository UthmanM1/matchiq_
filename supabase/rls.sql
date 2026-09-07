-- MATCHIQ Row Level Security policies.
-- Run after schema.sql. Enforces: a user can only ever read or write data
-- belonging to decisions/organisations they are a member of. The vendor
-- catalogue itself is public read (browsable without auth) but writes are
-- service-role only (adapter sync jobs), matching "public catalogue,
-- authenticated everything else" from the product spec.

-- ---------- helper: is the current user a member of this organisation? ----------
create or replace function is_org_member(org_id uuid) returns boolean as $$
  select exists (
    select 1 from organisation_members
    where organisation_id = org_id and user_id = auth.uid()
  );
$$ language sql stable security definer;

-- ---------- helper: does the current user belong to this decision's org? ----------
create or replace function is_decision_org_member(dec_id uuid) returns boolean as $$
  select exists (
    select 1 from decisions d
    join organisation_members m on m.organisation_id = d.organisation_id
    where d.id = dec_id and m.user_id = auth.uid()
  );
$$ language sql stable security definer;

alter table organisations enable row level security;
alter table organisation_members enable row level security;
alter table profiles enable row level security;
alter table vendors enable row level security;
alter table vendor_features enable row level security;
alter table vendor_integrations enable row level security;
alter table decisions enable row level security;
alter table decision_requirements enable row level security;
alter table clarification_questions enable row level security;
alter table clarification_answers enable row level security;
alter table decision_criteria enable row level security;
alter table decision_vendors enable row level security;
alter table vendor_scores enable row level security;
alter table decision_comments enable row level security;
alter table decision_votes enable row level security;
alter table decision_notes enable row level security;
alter table decision_members enable row level security;
alter table decision_reports enable row level security;
alter table analytics_events enable row level security;
alter table ai_usage enable row level security;

-- ---------- organisations & membership ----------
create policy "members can read their organisation"
  on organisations for select
  using (is_org_member(id));

create policy "members can read their membership rows"
  on organisation_members for select
  using (is_org_member(organisation_id));

create policy "owners/admins can invite members"
  on organisation_members for insert
  with check (
    exists (
      select 1 from organisation_members m
      where m.organisation_id = organisation_members.organisation_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- ---------- profiles ----------
create policy "members can read profiles in their organisation"
  on profiles for select
  using (is_org_member(organisation_id));

create policy "a user can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- ---------- vendor catalogue: public read, service-role write ----------
create policy "anyone can browse the vendor catalogue"
  on vendors for select
  using (true);

create policy "anyone can browse vendor features"
  on vendor_features for select
  using (true);

create policy "anyone can browse vendor integrations"
  on vendor_integrations for select
  using (true);

-- No insert/update/delete policies are defined for authenticated/anon roles
-- on vendors* tables, so only the service role (used by adapter sync jobs)
-- can write to the catalogue.

-- ---------- decisions & everything hanging off them ----------
create policy "org members can read their decisions"
  on decisions for select
  using (is_org_member(organisation_id));

create policy "org members can create decisions"
  on decisions for insert
  with check (is_org_member(organisation_id) and owner_id = auth.uid());

create policy "org members can update their decisions"
  on decisions for update
  using (is_org_member(organisation_id));

create policy "org members can read requirements"
  on decision_requirements for select
  using (is_decision_org_member(decision_id));
create policy "org members can write requirements"
  on decision_requirements for all
  using (is_decision_org_member(decision_id))
  with check (is_decision_org_member(decision_id));

create policy "org members can read clarification questions"
  on clarification_questions for select
  using (is_decision_org_member(decision_id));
create policy "org members can read clarification answers"
  on clarification_answers for select
  using (is_decision_org_member(decision_id));
create policy "org members can write clarification answers"
  on clarification_answers for insert
  with check (is_decision_org_member(decision_id));

create policy "org members can manage criteria"
  on decision_criteria for all
  using (is_decision_org_member(decision_id))
  with check (is_decision_org_member(decision_id));

create policy "org members can manage shortlist"
  on decision_vendors for all
  using (is_decision_org_member(decision_id))
  with check (is_decision_org_member(decision_id));

create policy "org members can read scores"
  on vendor_scores for select
  using (
    exists (
      select 1 from decision_vendors dv
      where dv.id = vendor_scores.decision_vendor_id
        and is_decision_org_member(dv.decision_id)
    )
  );

create policy "org members can read comments"
  on decision_comments for select
  using (is_decision_org_member(decision_id));
create policy "org members can post comments"
  on decision_comments for insert
  with check (is_decision_org_member(decision_id) and author_id = auth.uid());

create policy "org members can read votes"
  on decision_votes for select
  using (is_decision_org_member(decision_id));
create policy "org members can cast their own votes"
  on decision_votes for insert
  with check (is_decision_org_member(decision_id) and voter_id = auth.uid());
create policy "org members can change their own votes"
  on decision_votes for update
  using (voter_id = auth.uid());

create policy "org members can read notes"
  on decision_notes for select
  using (is_decision_org_member(decision_id));
create policy "org members can add notes"
  on decision_notes for insert
  with check (is_decision_org_member(decision_id) and author_id = auth.uid());

create policy "org members can read decision team"
  on decision_members for select
  using (is_decision_org_member(decision_id));
create policy "org members can invite to a decision"
  on decision_members for insert
  with check (is_decision_org_member(decision_id));

create policy "org members can read reports"
  on decision_reports for select
  using (is_decision_org_member(decision_id));
create policy "org members can generate reports"
  on decision_reports for insert
  with check (is_decision_org_member(decision_id) and generated_by = auth.uid());

-- ---------- analytics & AI usage: readable by org members, written server-side ----------
create policy "org members can read their analytics"
  on analytics_events for select
  using (is_org_member(organisation_id));

create policy "org members can read their AI usage"
  on ai_usage for select
  using (is_org_member(organisation_id));

-- Analytics/AI usage inserts happen via the server using the service role
-- key (see AnalyticsService / AIService), bypassing RLS by design — this
-- prevents a client from forging usage or event records.
