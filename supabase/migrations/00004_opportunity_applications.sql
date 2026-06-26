-- Creator applications for opportunity/job-board listings.
-- `creator_id` is text so demo users ("c1") and real Supabase UUID users can both
-- be recorded without blocking the demo flow.
create table if not exists public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null,
  creator_email text,
  creator_name text,
  loop_tag text,
  opportunity_id text not null,
  brand text not null,
  campaign text not null,
  platform text not null,
  deliverables text not null,
  base_pay_cents integer not null default 0,
  max_pay_cents integer not null default 0,
  applied_at timestamptz not null default now(),
  unique (creator_id, opportunity_id)
);

alter table public.opportunity_applications enable row level security;

create policy "creators read own applications" on public.opportunity_applications
  for select using (creator_id = auth.uid()::text);

-- Inserts are performed by the server/service role so confirmation emails and
-- duplicate protection stay centralized.
