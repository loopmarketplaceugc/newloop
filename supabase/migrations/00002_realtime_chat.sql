-- Realtime chat + live profile/gig fields.
-- Safe to run after 00001; every column/policy is additive.

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
