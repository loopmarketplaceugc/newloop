-- ===== Workflow gig parameters + expiry =====

-- New deal parameters set at offer time and frozen into the contract.
alter table gigs add column if not exists min_post_lifetime_days integer not null default 30;
alter table gigs add column if not exists revision_rounds integer not null default 2;
alter table gigs add column if not exists video_length_seconds integer;

-- Publish step: the creator submits the live post link before final approval.
alter table gigs add column if not exists published_url text;
alter table gigs add column if not exists published_at timestamptz;

-- Set when funds are released so the expiry clock can start.
alter table gigs add column if not exists completed_at timestamptz;

-- Durable expiry: flip COMPLETED -> EXPIRED once the post has been live for the
-- agreed minimum lifetime. Runs daily via pg_cron; the client also derives
-- EXPIRED on read (effectiveStatus) for instant feedback.
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'expire-completed-gigs',
      '0 3 * * *',
      $cron$
        update gigs set status = 'EXPIRED'
        where status = 'COMPLETED' and completed_at is not null
          and completed_at + (min_post_lifetime_days || ' days')::interval < now();
      $cron$
    );
  end if;
end;
$$;
