-- ===== Money integrity & anti-double-spend =====

-- 1. Idempotency: at most one of each ledger entry type per gig.
--    Hard guarantee against double-fund / double-release at the DB level.
alter table transactions
  add constraint transactions_gig_type_unique unique (gig_id, type);

-- 2. Atomic creator balance credit (avoids read-modify-write races across
--    concurrent gig approvals for the same creator). Service-role only.
create or replace function credit_balance(p_uid uuid, p_amount integer)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set balance_cents = balance_cents + p_amount where id = p_uid;
$$;

revoke execute on function credit_balance(uuid, integer) from public, anon, authenticated;
grant execute on function credit_balance(uuid, integer) to service_role;

-- 3. Freeze the priced amount once a gig is funded. Defense-in-depth so a
--    compromised/tampered client cannot inflate price_cents (and therefore the
--    payout) after the brand has paid into escrow. Price may still be
--    (re)negotiated while the gig is pre-funding.
create or replace function freeze_funded_gig_price()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if OLD.status not in ('DRAFT','OFFER_SENT','OFFER_ACCEPTED')
     and (NEW.price_cents is distinct from OLD.price_cents
          or NEW.fee_cents is distinct from OLD.fee_cents) then
    raise exception 'price is frozen once a gig is funded';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_freeze_price on gigs;
create trigger trg_freeze_price
  before update on gigs
  for each row
  execute function freeze_funded_gig_price();
