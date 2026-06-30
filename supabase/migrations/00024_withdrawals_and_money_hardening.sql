-- Money-system hardening (payment audit follow-up).

-- 1) Withdrawals ledger — one row per creator withdrawal request. The unique
--    idempotency_key (client-supplied, stable per attempt) makes a retried or
--    duplicated submit a no-op instead of a double payout.
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles on delete cascade,
  idempotency_key text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  method text not null check (method in ('cashapp', 'venmo', 'zelle', 'card')),
  destination text,
  status text not null default 'processing'
    check (status in ('processing', 'requested', 'paid', 'failed')),
  stripe_ref text,
  created_at timestamptz not null default now()
);
alter table withdrawals enable row level security;
-- Creators may read their own withdrawal history; all writes are service-role only.
drop policy if exists "withdrawals owner read" on withdrawals;
create policy "withdrawals owner read" on withdrawals for select using (creator_id = auth.uid());

-- 2) Webhook event idempotency for the one non-idempotent handler (balance
--    top-up). Gig funding/release are already idempotent via unique(gig_id,type),
--    and account.updated via claim_balance — so only top-ups need this.
create table if not exists processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);
alter table processed_stripe_events enable row level security;
-- No policies → only the service role (which bypasses RLS) can touch it.

-- Atomically credit a balance exactly once per Stripe event. The marker insert
-- and the credit share one transaction, so a redelivered event is a no-op and a
-- mid-call crash rolls back BOTH (Stripe's retry then reprocesses cleanly) —
-- avoiding both double-credit and dropped-credit.
create or replace function credit_balance_once(p_uid uuid, p_amount integer, p_event_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into processed_stripe_events (event_id) values (p_event_key);
  update profiles set balance_cents = balance_cents + p_amount where id = p_uid;
  return true;
exception when unique_violation then
  return false; -- already processed
end;
$$;
revoke execute on function credit_balance_once(uuid, integer, text) from public, anon, authenticated;
grant execute on function credit_balance_once(uuid, integer, text) to service_role;

-- 3) Defense-in-depth: a profile's balance can never go negative.
alter table profiles drop constraint if exists profiles_balance_nonneg;
alter table profiles add constraint profiles_balance_nonneg check (balance_cents >= 0);
