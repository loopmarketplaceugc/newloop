-- Atomic balance debit for spending a brand's pre-loaded balance on a gig.
-- Locks the row, debits EXACTLY p_amount only if the full amount is available,
-- and returns whether it succeeded. Prevents overdraw and read-modify-write
-- races across concurrent gig fundings by the same brand.
create or replace function debit_balance(p_uid uuid, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    return false;
  end if;
  select balance_cents into v_balance from profiles where id = p_uid for update;
  if v_balance is null or v_balance < p_amount then
    return false; -- insufficient funds; caller falls back to charging a card
  end if;
  update profiles set balance_cents = balance_cents - p_amount where id = p_uid;
  return true;
end;
$$;

revoke execute on function debit_balance(uuid, integer) from public, anon, authenticated;
grant execute on function debit_balance(uuid, integer) to service_role;
