-- Reduce self-notification noise: don't notify the user who triggered the
-- status change. For service-role transitions (funding/release) auth.uid() is
-- null, so both parties are still notified.
create or replace function notify_on_gig_status()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.status is not distinct from old.status then return new; end if;
  v_title := case new.status
    when 'OFFER_ACCEPTED'     then 'Offer accepted'
    when 'FUNDED_IN_ESCROW'   then 'Payment secured'
    when 'PRODUCT_SHIPPED'    then 'Product shipped'
    when 'DELIVERED'          then 'Deliverable submitted'
    when 'REVISION_REQUESTED' then 'Revision requested'
    when 'APPROVED'           then 'Draft approved'
    when 'PUBLISHED'          then 'Post published'
    when 'COMPLETED'          then 'Gig completed'
    when 'CANCELLED'          then 'Gig cancelled'
    when 'DISPUTED'           then 'Gig in dispute'
    else null
  end;
  if v_title is null then return new; end if;
  insert into notifications (user_id, title, body, href)
  select uid, v_title, 'Gig "' || new.title || '" — ' || v_title || '.', '/gig/' || new.id::text
  from (values (new.company_id), (new.creator_id)) as t(uid)
  where uid is not null
    and (auth.uid() is null or uid <> auth.uid());
  return new;
end;
$$;
