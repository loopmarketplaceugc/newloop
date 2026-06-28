-- =============================================================
-- Loop FULL SCHEMA — apply once to a fresh Supabase project.
-- SQL Editor: paste this entire file and click RUN.
-- =============================================================


-- ----------------------------------------------------------------
-- 00001: init — core tables, types, RLS
-- ----------------------------------------------------------------

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

-- RLS
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

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (id = auth.uid());
create policy "users insert own profile" on profiles for insert with check (id = auth.uid());

create policy "creator details readable" on creator_details for select using (true);
create policy "creator details owner write" on creator_details for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "platforms readable" on creator_platforms for select using (true);
create policy "platforms owner write" on creator_platforms for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "portfolio readable" on portfolio_items for select using (true);
create policy "portfolio owner write" on portfolio_items for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());

create policy "companies readable" on companies for select using (true);
create policy "companies owner write" on companies for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "gig parties read" on gigs for select using (company_id = auth.uid() or creator_id = auth.uid());
create policy "company creates gig" on gigs for insert with check (company_id = auth.uid());
create policy "gig parties update" on gigs for update using (company_id = auth.uid() or creator_id = auth.uid());

create policy "contract parties read" on contracts for select using (is_gig_party(gig_id));

create policy "message parties read" on messages for select using (is_gig_party(gig_id));
create policy "sender writes message" on messages for insert with check (sender_id = auth.uid() and is_gig_party(gig_id));

create policy "script owner all" on scripts for all using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "gig creator reads attached script" on scripts for select using (gig_id is not null and is_gig_party(gig_id));

create policy "deliverable parties read" on deliverables for select using (is_gig_party(gig_id));
create policy "creator submits deliverable" on deliverables for insert
  with check (exists (select 1 from gigs where id = gig_id and creator_id = auth.uid()));

create policy "tx parties read" on transactions for select using (is_gig_party(gig_id));

create policy "reviews readable" on reviews for select using (true);
create policy "author reviews completed gig" on reviews for insert with check (
  author_id = auth.uid() and is_gig_party(gig_id)
  and exists (select 1 from gigs where id = gig_id and status = 'COMPLETED')
);


-- ----------------------------------------------------------------
-- 00002: realtime chat + extra profile/gig columns
-- ----------------------------------------------------------------

alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists avatar_hue integer not null default 285;

alter table gigs add column if not exists platform text not null default 'tiktok'
  check (platform in ('tiktok','reels','shorts'));
alter table gigs add column if not exists physical_product boolean not null default false;
alter table gigs add column if not exists delivered_at timestamptz;
alter table gigs add column if not exists revision_count integer not null default 0;
alter table gigs add column if not exists script_id uuid references scripts on delete set null;

do $$
begin
  create policy "sender updates own message" on messages
    for update using (sender_id = auth.uid() and is_gig_party(gig_id))
    with check (sender_id = auth.uid() and is_gig_party(gig_id));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.gigs;
exception
  when duplicate_object then null;
end $$;


-- ----------------------------------------------------------------
-- 00003: creator platform metrics
-- ----------------------------------------------------------------

alter table creator_platforms add column if not exists post_count integer;
alter table creator_platforms add column if not exists average_views integer;


-- ----------------------------------------------------------------
-- 00004: opportunity applications
-- ----------------------------------------------------------------

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


-- ----------------------------------------------------------------
-- 00005: stripe customer id
-- ----------------------------------------------------------------

alter table profiles add column if not exists stripe_customer_id text;


-- ----------------------------------------------------------------
-- 00006: requests, balance
-- ----------------------------------------------------------------

alter table profiles add column if not exists balance_cents integer not null default 0;

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references profiles on delete cascade,
  title text not null,
  description text,
  platforms text[] not null default '{}',
  num_creators integer not null default 1,
  reels_per_creator integer not null default 1,
  pay_per_creator_cents integer not null default 0,
  deadline_at timestamptz,
  merch_included boolean not null default false,
  merch_description text,
  status text not null default 'open' check (status in ('open', 'closed', 'draft')),
  created_at timestamptz not null default now()
);

create table if not exists request_applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests on delete cascade,
  creator_id uuid not null references profiles on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  applied_at timestamptz not null default now(),
  unique(request_id, creator_id)
);


-- ----------------------------------------------------------------
-- RPC: signup_instant
-- Creates a pre-confirmed user, bypassing email confirmation.
-- Called from the client with the anon key; runs as postgres
-- (security definer) so it can write to auth.users.
-- ----------------------------------------------------------------

create or replace function public.signup_instant(
  p_email text,
  p_password text,
  p_role text default 'creator'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := gen_random_uuid();
begin
  -- If user already exists, signal that to the caller
  if exists (select 1 from auth.users where email = lower(p_email)) then
    return jsonb_build_object('status', 'exists');
  end if;

  -- Insert a pre-confirmed user directly into auth.users
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', p_role),
    false,
    now(), now(),
    '', '', '', ''
  );

  -- Create the email identity record (required for Supabase Auth v2)
  insert into auth.identities (
    provider_id, user_id, identity_data,
    provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', lower(p_email),
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(), now(), now()
  );

  return jsonb_build_object();
exception
  when unique_violation then
    return jsonb_build_object('status', 'exists');
end;
$$;

grant execute on function public.signup_instant(text, text, text) to anon;
grant execute on function public.signup_instant(text, text, text) to authenticated;


-- ----------------------------------------------------------------
-- RPC: mint_loop_tag
-- Returns the caller's unique Loop certification tag, minting one
-- on first call and returning the same tag on subsequent calls.
-- ----------------------------------------------------------------

alter table profiles add column if not exists loop_tag text unique;

create or replace function public.mint_loop_tag()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_tag      text;
  alphabet   constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  block1     text;
  block2     text;
  i          int;
begin
  -- Return existing tag if already minted
  select loop_tag into v_existing from profiles where id = auth.uid();
  if v_existing is not null then
    return v_existing;
  end if;

  -- Generate a unique LOOP-XXXX-XXXX tag
  loop
    block1 := '';
    block2 := '';
    for i in 1..4 loop
      block1 := block1 || substr(alphabet, (floor(random() * length(alphabet)) + 1)::int, 1);
      block2 := block2 || substr(alphabet, (floor(random() * length(alphabet)) + 1)::int, 1);
    end loop;
    v_tag := 'LOOP-' || block1 || '-' || block2;
    exit when not exists (select 1 from profiles where loop_tag = v_tag);
  end loop;

  update profiles set loop_tag = v_tag where id = auth.uid();
  return v_tag;
end;
$$;

grant execute on function public.mint_loop_tag() to authenticated;
