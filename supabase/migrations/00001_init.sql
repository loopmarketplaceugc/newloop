-- Loop schema — RLS on every table.
-- Principle: creators read/write only their rows; companies only theirs;
-- both parties read shared gigs/messages/contracts; transactions read-only to participants.

create type user_role as enum ('creator', 'company');
create type creator_status as enum ('open', 'busy', 'away');
create type compensation_pref as enum ('paid_only', 'product_ok', 'product_plus');
create type gig_status as enum (
  'DRAFT','OFFER_SENT','OFFER_ACCEPTED','FUNDED_IN_ESCROW','PRODUCT_SHIPPED','PRODUCT_DELIVERED',
  'IN_PRODUCTION','DELIVERED','REVISION_REQUESTED','APPROVED','PAID_OUT','COMPLETED','DISPUTED','CANCELLED'
);
create type message_kind as enum ('text','attachment','script','offer');
create type tx_type as enum ('fund','release','refund','fee');
create type script_kind as enum ('script','brief');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null,
  handle text unique not null check (handle ~ '^[a-z0-9._]{3,30}$'),
  name text not null,
  avatar_url text,
  bio text,
  location text,
  status creator_status not null default 'open',
  created_at timestamptz not null default now()
);

create table creator_details (
  profile_id uuid primary key references profiles on delete cascade,
  tier text not null default 'nano',
  base_rate_cents integer not null default 0 check (base_rate_cents >= 0),
  usage_upcharge_pct integer not null default 30,
  raw_upcharge_pct integer not null default 40,
  capacity_per_week integer not null default 3 check (capacity_per_week between 1 and 20),
  compensation_pref compensation_pref not null default 'product_plus',
  niches text[] not null default '{}',
  media_kit_url text
);

create table creator_platforms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles on delete cascade,
  platform text not null check (platform in ('tiktok','reels','shorts')),
  url text not null,
  follower_count integer not null default 0,
  unique (creator_id, platform)
);

create table portfolio_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles on delete cascade,
  type text not null check (type in ('video','photo')),
  storage_path text not null,
  thumbnail text,
  sort integer not null default 0
);

create table companies (
  profile_id uuid primary key references profiles on delete cascade,
  company_name text not null,
  website text,
  niches text[] not null default '{}',
  budget_range text
);

create table gigs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references profiles,
  creator_id uuid not null references profiles,
  status gig_status not null default 'DRAFT',
  title text not null,
  brief text,
  price_cents integer not null default 0 check (price_cents >= 0),
  fee_cents integer not null default 0,
  usage_days integer not null default 90,
  usage_expires_at timestamptz,
  raw_footage boolean not null default false,
  deadline timestamptz,
  tracking_number text,
  created_at timestamptz not null default now()
);

create table contracts (
  gig_id uuid primary key references gigs on delete cascade,
  terms jsonb not null,
  company_signed_at timestamptz,
  creator_signed_at timestamptz
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references gigs on delete cascade,
  sender_id uuid not null references profiles,
  kind message_kind not null default 'text',
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table scripts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references profiles,
  gig_id uuid references gigs on delete set null,
  inputs jsonb not null,
  output jsonb not null,
  kind script_kind not null default 'script',
  created_at timestamptz not null default now()
);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references gigs on delete cascade,
  storage_path text not null,
  version integer not null default 1,
  watermarked boolean not null default true,
  submitted_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references gigs,
  type tx_type not null,
  amount_cents integer not null check (amount_cents >= 0),
  stripe_ref text,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references gigs,
  author_id uuid not null references profiles,
  target_id uuid not null references profiles,
  rating integer not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  body text,
  created_at timestamptz not null default now(),
  unique (gig_id, author_id)
);

-- ===== RLS =====
alter table profiles enable row level security;
alter table creator_details enable row level security;
alter table creator_platforms enable row level security;
alter table portfolio_items enable row level security;
alter table companies enable row level security;
alter table gigs enable row level security;
alter table contracts enable row level security;
alter table messages enable row level security;
alter table scripts enable row level security;
alter table deliverables enable row level security;
alter table transactions enable row level security;
alter table reviews enable row level security;

create or replace function is_gig_party(g_id uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from gigs where id = g_id
      and (company_id = auth.uid() or creator_id = auth.uid())
  );
$$;

-- profiles: public read (discovery), self write
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (id = auth.uid());
create policy "users insert own profile" on profiles for insert with check (id = auth.uid());

-- creator surface: public read, owner write
create policy "creator details readable" on creator_details for select using (true);
create policy "creator details owner write" on creator_details for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "platforms readable" on creator_platforms for select using (true);
create policy "platforms owner write" on creator_platforms for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "portfolio readable" on portfolio_items for select using (true);
create policy "portfolio owner write" on portfolio_items for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- companies: public read, owner write
create policy "companies readable" on companies for select using (true);
create policy "companies owner write" on companies for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- gigs: both parties read; company creates; both parties update (state machine enforced in API layer)
create policy "gig parties read" on gigs for select using (company_id = auth.uid() or creator_id = auth.uid());
create policy "company creates gig" on gigs for insert with check (company_id = auth.uid());
create policy "gig parties update" on gigs for update using (company_id = auth.uid() or creator_id = auth.uid());

-- contracts: parties read only (writes via service role on offer acceptance)
create policy "contract parties read" on contracts for select using (is_gig_party(gig_id));

-- messages: parties read; sender writes own messages into own gigs
create policy "message parties read" on messages for select using (is_gig_party(gig_id));
create policy "sender writes message" on messages for insert with check (sender_id = auth.uid() and is_gig_party(gig_id));

-- scripts: company owns; creator of an attached gig can read
create policy "script owner all" on scripts for all using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "gig creator reads attached script" on scripts for select using (gig_id is not null and is_gig_party(gig_id));

-- deliverables: parties read; creator submits
create policy "deliverable parties read" on deliverables for select using (is_gig_party(gig_id));
create policy "creator submits deliverable" on deliverables for insert
  with check (exists (select 1 from gigs where id = gig_id and creator_id = auth.uid()));

-- transactions: read-only to participants (writes via service role / Stripe webhook)
create policy "tx parties read" on transactions for select using (is_gig_party(gig_id));

-- reviews: public read; author writes after completion, one per gig per author
create policy "reviews readable" on reviews for select using (true);
create policy "author reviews completed gig" on reviews for insert with check (
  author_id = auth.uid() and is_gig_party(gig_id)
  and exists (select 1 from gigs where id = gig_id and status = 'COMPLETED')
);

-- Storage buckets (run in dashboard or via API): portfolio-media, media-kits, deliverables
-- deliverables bucket: private; signed URLs only after APPROVED (enforced in API layer).
