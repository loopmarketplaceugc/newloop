-- Atomic owed-balance claim: lock the row, zero the balance, return the prior
-- amount. Lets the server pay out an owed balance exactly once even under
-- concurrent calls (status refresh + account.updated webhook can race).
create or replace function claim_balance(p_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount integer;
begin
  select balance_cents into v_amount from profiles where id = p_uid for update;
  if v_amount is null or v_amount <= 0 then
    return 0;
  end if;
  update profiles set balance_cents = 0 where id = p_uid;
  return v_amount;
end;
$$;

revoke execute on function claim_balance(uuid) from public, anon, authenticated;
grant execute on function claim_balance(uuid) to service_role;
