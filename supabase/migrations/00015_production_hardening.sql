-- ===== Production hardening: gig state-machine enforcement, notifications, definer lockdown =====

-- 1. Legal-transition lookup mirroring lib/gig-machine.ts TRANSITIONS.
create or replace function gig_allowed_next(p_from gig_status)
returns gig_status[]
language sql immutable
set search_path = public
as $$
  select (case p_from
    when 'DRAFT'              then array['OFFER_SENT','CANCELLED']
    when 'OFFER_SENT'         then array['OFFER_ACCEPTED','CANCELLED']
    when 'OFFER_ACCEPTED'     then array['FUNDED_IN_ESCROW','CANCELLED']
    when 'FUNDED_IN_ESCROW'   then array['PRODUCT_SHIPPED','IN_PRODUCTION','CANCELLED','DISPUTED']
    when 'PRODUCT_SHIPPED'    then array['PRODUCT_DELIVERED','DISPUTED']
    when 'PRODUCT_DELIVERED'  then array['IN_PRODUCTION','DISPUTED']
    when 'IN_PRODUCTION'      then array['DELIVERED','DISPUTED','CANCELLED']
    when 'DELIVERED'          then array['APPROVED','REVISION_REQUESTED','DISPUTED']
    when 'REVISION_REQUESTED' then array['DELIVERED','DISPUTED']
    when 'APPROVED'           then array['PUBLISHED','DISPUTED']
    when 'PUBLISHED'          then array['COMPLETED','DISPUTED']
    when 'PAID_OUT'           then array['COMPLETED']
    when 'COMPLETED'          then array['EXPIRED']
    when 'DISPUTED'           then array['CANCELLED','APPROVED']
    else array[]::text[]
  end)::gig_status[];
$$;

-- 2. Enforce the state machine at the DB layer for client (authenticated) writes.
--    Service role (server/ledger/webhook) and maintenance roles (pg_cron) are trusted.
create or replace function enforce_gig_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- Only real end-user requests are untrusted. service_role, postgres, cron, etc. pass.
  if coalesce(auth.role(), 'postgres') not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Identity columns are immutable for client writes.
  if new.company_id is distinct from old.company_id
     or new.creator_id is distinct from old.creator_id
     or new.created_at is distinct from old.created_at then
    raise exception 'gig identity is immutable';
  end if;

  if new.status is distinct from old.status then
    -- Must be a legal transition.
    if not (new.status = any (gig_allowed_next(old.status))) then
      raise exception 'illegal gig transition % -> %', old.status, new.status;
    end if;

    -- Money / lifecycle statuses are set by the server only.
    if new.status in ('FUNDED_IN_ESCROW','COMPLETED','PAID_OUT','EXPIRED','CANCELLED') then
      raise exception 'status % may only be set by the server', new.status;
    end if;

    -- Per-actor rules for the remaining client-driven transitions.
    if new.status in ('OFFER_ACCEPTED','DELIVERED','PUBLISHED','PRODUCT_DELIVERED')
       and v_uid is distinct from old.creator_id then
      raise exception 'only the creator can move a gig to %', new.status;
    end if;
    if new.status in ('OFFER_SENT','APPROVED','REVISION_REQUESTED','PRODUCT_SHIPPED')
       and v_uid is distinct from old.company_id then
      raise exception 'only the brand can move a gig to %', new.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_gig_update on gigs;
create trigger trg_enforce_gig_update
  before update on gigs
  for each row execute function enforce_gig_update();

-- 3. Notifications: real, cross-user, DB-authored.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

alter table notifications enable row level security;
drop policy if exists "own notifications read" on notifications;
drop policy if exists "own notifications update" on notifications;
create policy "own notifications read" on notifications for select using (user_id = auth.uid());
create policy "own notifications update" on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No client INSERT policy: rows are authored by SECURITY DEFINER triggers / service role.

-- Notify the counterparty when a message is posted.
create or replace function notify_on_message()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_creator uuid;
  v_recipient uuid;
  v_sender_name text;
begin
  select company_id, creator_id into v_company, v_creator from gigs where id = new.gig_id;
  if v_company is null then return new; end if;
  v_recipient := case when new.sender_id = v_company then v_creator else v_company end;
  if v_recipient is null or v_recipient = new.sender_id then return new; end if;
  select coalesce(nullif(name, ''), 'Someone') into v_sender_name from profiles where id = new.sender_id;
  insert into notifications (user_id, title, body, href)
  values (v_recipient, 'New message',
          coalesce(v_sender_name, 'Someone') || ' sent you a message.',
          '/gig/' || new.gig_id::text);
  return new;
end;
$$;

drop trigger if exists trg_notify_on_message on messages;
create trigger trg_notify_on_message after insert on messages
  for each row execute function notify_on_message();

-- Notify both parties on a meaningful gig status change.
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
  where uid is not null;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_gig_status on gigs;
create trigger trg_notify_on_gig_status after update on gigs
  for each row execute function notify_on_gig_status();

-- 4. Lock down SECURITY DEFINER functions (advisor warnings).
--    The earlier revoke targeted only anon/authenticated and missed the default PUBLIC grant.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.is_gig_party(uuid) from public, anon;
-- is_gig_party is an RLS helper referenced by policies; authenticated users must
-- retain EXECUTE or those policy checks fail. It keys off auth.uid().
grant execute on function public.is_gig_party(uuid) to authenticated;
revoke execute on function public.mint_loop_tag() from public;
grant execute on function public.mint_loop_tag() to authenticated;
