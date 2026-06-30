-- Generated to mirror the 50 demo creators in lib/seed.ts.
-- Seeds them as real, browsable accounts ("placebo" supply):
-- companies can discover, open, and message/offer them; no human is behind them so
-- they never respond. Idempotent: re-running upserts the same rows (stable UUIDs via
-- md5('loop-placebo-'||handle)). auth.users password is blank => these accounts cannot log in.

-- Mia Tanaka (@mia.creates)
do $$
declare uid uuid := md5('loop-placebo-mia.creates')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'mia.creates@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Mia Tanaka"}'::jsonb,
    now() - interval '0 hours', now() - interval '0 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'mia.creates', 'Mia Tanaka', 'https://randomuser.me/api/portraits/women/26.jpg', 160,
    'UGC for beauty & skincare brands. 200+ videos shipped. I write my own hooks and turn drafts around in 72 hours.', 'Los Angeles, CA', 'open', 'mia.creates@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 35000, 30, 40, 5, 'product_plus', array['beauty','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@mia.creates',42300),
    (uid,'reels','https://instagram.com/mia.creates',18900);
end $$;

-- Darius Cole (@dev.darius)
do $$
declare uid uuid := md5('loop-placebo-dev.darius')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'dev.darius@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Darius Cole"}'::jsonb,
    now() - interval '1 hours', now() - interval '1 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'dev.darius', 'Darius Cole', 'https://randomuser.me/api/portraits/men/4.jpg', 210,
    'Tech & SaaS explainer videos that don''t feel like ads. Ex-PM, so I actually understand your product.', 'Austin, TX', 'open', 'dev.darius@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 65000, 35, 40, 3, 'paid_only', array['tech','SaaS','finance'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@dev.darius',128000),
    (uid,'shorts','https://youtube.com/@devdarius',86000);
end $$;

-- Sophia Reyes (@soph.eats)
do $$
declare uid uuid := md5('loop-placebo-soph.eats')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'soph.eats@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Sophia Reyes"}'::jsonb,
    now() - interval '2 hours', now() - interval '2 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'soph.eats', 'Sophia Reyes', 'https://randomuser.me/api/portraits/women/19.jpg', 25,
    'Food content with cinematic close-ups. Restaurants, CPG snacks, meal kits — if it''s edible, I''ll make it look irresistible.', 'Chicago, IL', 'busy', 'soph.eats@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 28000, 30, 35, 4, 'product_plus', array['food','local'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/soph.eats',33500),
    (uid,'tiktok','https://tiktok.com/@soph.eats',21000);
end $$;

-- Lena Okafor (@liftwithlena)
do $$
declare uid uuid := md5('loop-placebo-liftwithlena')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'liftwithlena@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Lena Okafor"}'::jsonb,
    now() - interval '3 hours', now() - interval '3 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'liftwithlena', 'Lena Okafor', 'https://randomuser.me/api/portraits/women/9.jpg', 300,
    'Fitness UGC — supplements, apparel, home gym gear. Real workouts, real sweat, honest reviews your audience trusts.', 'Miami, FL', 'open', 'liftwithlena@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 120000, 40, 50, 2, 'paid_only', array['fitness','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@liftwithlena',410000),
    (uid,'reels','https://instagram.com/liftwithlena',265000);
end $$;

-- Jake Moreau (@jakeunboxes)
do $$
declare uid uuid := md5('loop-placebo-jakeunboxes')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'jakeunboxes@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Jake Moreau"}'::jsonb,
    now() - interval '4 hours', now() - interval '4 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'jakeunboxes', 'Jake Moreau', 'https://randomuser.me/api/portraits/men/11.jpg', 45,
    'Gadget unboxings and honest first impressions. Clean desk setups, crisp audio, zero fluff.', 'Seattle, WA', 'open', 'jakeunboxes@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 15000, 25, 30, 6, 'product_ok', array['tech','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@jakeunboxes',8200),
    (uid,'tiktok','https://tiktok.com/@jakeunboxes',5600);
end $$;

-- Amara Diallo (@theglowarchive)
do $$
declare uid uuid := md5('loop-placebo-theglowarchive')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'theglowarchive@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Amara Diallo"}'::jsonb,
    now() - interval '5 hours', now() - interval '5 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'theglowarchive', 'Amara Diallo', 'https://randomuser.me/api/portraits/women/33.jpg', 280,
    'Luxury-feel beauty content on an indie budget. Soft lighting, slow pans, voiceovers that convert.', 'New York, NY', 'open', 'theglowarchive@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 55000, 30, 40, 4, 'product_plus', array['beauty','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/theglowarchive',96000);
end $$;

-- Carlos Vega (@casa.carlos)
do $$
declare uid uuid := md5('loop-placebo-casa.carlos')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'casa.carlos@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Carlos Vega"}'::jsonb,
    now() - interval '6 hours', now() - interval '6 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'casa.carlos', 'Carlos Vega', 'https://randomuser.me/api/portraits/men/19.jpg', 95,
    'Home & DIY content. Renovation b-roll, tool reviews, organization hacks. Dad energy, real results.', 'Phoenix, AZ', 'away', 'casa.carlos@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 22000, 25, 35, 3, 'product_ok', array['home','local'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@casa.carlos',27400),
    (uid,'shorts','https://youtube.com/@casacarlos',12100);
end $$;

-- Priya Sharma (@petsofpriya)
do $$
declare uid uuid := md5('loop-placebo-petsofpriya')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'petsofpriya@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Priya Sharma"}'::jsonb,
    now() - interval '7 hours', now() - interval '7 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'petsofpriya', 'Priya Sharma', 'https://randomuser.me/api/portraits/women/60.jpg', 15,
    'Pet content featuring two golden retrievers and a very judgmental cat. Treats, toys, tech for pets.', 'Denver, CO', 'open', 'petsofpriya@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 30000, 30, 40, 5, 'product_plus', array['pets','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@petsofpriya',48700),
    (uid,'reels','https://instagram.com/petsofpriya',31200);
end $$;

-- Wes Kim (@wanderwithwes)
do $$
declare uid uuid := md5('loop-placebo-wanderwithwes')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'wanderwithwes@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Wes Kim"}'::jsonb,
    now() - interval '8 hours', now() - interval '8 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'wanderwithwes', 'Wes Kim', 'https://randomuser.me/api/portraits/men/9.jpg', 195,
    'Travel & lifestyle UGC. Hotels, luggage, booking apps. Shot on cinema glass, delivered in vertical.', 'San Diego, CA', 'open', 'wanderwithwes@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 75000, 35, 45, 2, 'paid_only', array['travel','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/wanderwithwes',152000),
    (uid,'tiktok','https://tiktok.com/@wanderwithwes',74000);
end $$;

-- Fern Whitaker (@frugal.fern)
do $$
declare uid uuid := md5('loop-placebo-frugal.fern')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'frugal.fern@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Fern Whitaker"}'::jsonb,
    now() - interval '9 hours', now() - interval '9 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'frugal.fern', 'Fern Whitaker', 'https://randomuser.me/api/portraits/women/50.jpg', 130,
    'Personal finance made unscary. Budgeting apps, cashback tools, banks. Plain-English scripts, high retention.', 'Columbus, OH', 'open', 'frugal.fern@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 18000, 30, 40, 7, 'paid_only', array['finance','SaaS'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@frugal.fern',9300);
end $$;

-- Meg Lawson (@mamabearmeg)
do $$
declare uid uuid := md5('loop-placebo-mamabearmeg')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'mamabearmeg@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Meg Lawson"}'::jsonb,
    now() - interval '10 hours', now() - interval '10 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'mamabearmeg', 'Meg Lawson', 'https://randomuser.me/api/portraits/women/75.jpg', 340,
    'Parenting & family products tested by three kids under six. If it survives my house, it''ll survive anything.', 'Nashville, TN', 'busy', 'mamabearmeg@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 32000, 30, 40, 3, 'product_plus', array['parenting','home','food'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/mamabearmeg',39800),
    (uid,'tiktok','https://tiktok.com/@mamabearmeg',26500);
end $$;

-- Atlas Nguyen (@atlas.runs)
do $$
declare uid uuid := md5('loop-placebo-atlas.runs')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'atlas.runs@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Atlas Nguyen"}'::jsonb,
    now() - interval '11 hours', now() - interval '11 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'atlas.runs', 'Atlas Nguyen', 'https://randomuser.me/api/portraits/men/50.jpg', 250,
    'Running & endurance gear. Shoe reviews at mile 40, not mile zero. Marathon PR 2:51.', 'Portland, OR', 'open', 'atlas.runs@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 110000, 40, 50, 2, 'paid_only', array['fitness','travel'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@atlasruns',295000),
    (uid,'tiktok','https://tiktok.com/@atlas.runs',188000);
end $$;

-- Zara Mitchell (@zara.styles)
do $$
declare uid uuid := md5('loop-placebo-zara.styles')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'zara.styles@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Zara Mitchell"}'::jsonb,
    now() - interval '12 hours', now() - interval '12 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'zara.styles', 'Zara Mitchell', 'https://randomuser.me/api/portraits/women/44.jpg', 8,
    'Streetwear, beauty drops, and try-on edits with fast hooks and clean transitions.', 'Atlanta, GA', 'open', 'zara.styles@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 38000, 30, 40, 5, 'product_plus', array['fashion','beauty'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/zara.styles',29400),
    (uid,'tiktok','https://tiktok.com/@zara.styles',18200);
end $$;

-- Noah Park (@noah.byte)
do $$
declare uid uuid := md5('loop-placebo-noah.byte')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'noah.byte@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Noah Park"}'::jsonb,
    now() - interval '13 hours', now() - interval '13 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'noah.byte', 'Noah Park', 'https://randomuser.me/api/portraits/men/32.jpg', 215,
    'App walkthroughs, AI tools, and crisp product explainers for teams that sell complex software.', 'San Jose, CA', 'open', 'noah.byte@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 72000, 35, 40, 3, 'paid_only', array['tech','SaaS'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@noahbyte',112000),
    (uid,'tiktok','https://tiktok.com/@noah.byte',64500);
end $$;

-- Imani Brooks (@imani.bites)
do $$
declare uid uuid := md5('loop-placebo-imani.bites')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'imani.bites@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Imani Brooks"}'::jsonb,
    now() - interval '14 hours', now() - interval '14 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'imani.bites', 'Imani Brooks', 'https://randomuser.me/api/portraits/women/65.jpg', 36,
    'Restaurant reels, farmers market finds, and CPG snack content with warm natural light.', 'Charlotte, NC', 'busy', 'imani.bites@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 34000, 30, 40, 4, 'product_plus', array['food','local'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/imani.bites',41000),
    (uid,'tiktok','https://tiktok.com/@imani.bites',22300);
end $$;

-- Theo Martinez (@theo.trains)
do $$
declare uid uuid := md5('loop-placebo-theo.trains')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'theo.trains@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Theo Martinez"}'::jsonb,
    now() - interval '15 hours', now() - interval '15 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'theo.trains', 'Theo Martinez', 'https://randomuser.me/api/portraits/men/75.jpg', 245,
    'Functional fitness, recovery tools, and active travel content shot in real training blocks.', 'Salt Lake City, UT', 'open', 'theo.trains@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 68000, 35, 40, 3, 'paid_only', array['fitness','travel'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@theo.trains',88000),
    (uid,'reels','https://instagram.com/theo.trains',57200);
end $$;

-- Harper Quinn (@harper.home)
do $$
declare uid uuid := md5('loop-placebo-harper.home')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'harper.home@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Harper Quinn"}'::jsonb,
    now() - interval '16 hours', now() - interval '16 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'harper.home', 'Harper Quinn', 'https://randomuser.me/api/portraits/women/68.jpg', 335,
    'Parenting, organization, and home routines for practical products that make family life easier.', 'Raleigh, NC', 'open', 'harper.home@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 31000, 30, 40, 4, 'product_plus', array['parenting','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/harper.home',36700),
    (uid,'tiktok','https://tiktok.com/@harper.home',19600);
end $$;

-- Aaliyah Stone (@aaliyah.glow)
do $$
declare uid uuid := md5('loop-placebo-aaliyah.glow')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'aaliyah.glow@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Aaliyah Stone"}'::jsonb,
    now() - interval '17 hours', now() - interval '17 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'aaliyah.glow', 'Aaliyah Stone', 'https://randomuser.me/api/portraits/women/21.jpg', 292,
    'Skincare routines, texture shots, and beauty voiceovers with a polished editorial feel.', 'Brooklyn, NY', 'open', 'aaliyah.glow@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 135000, 40, 50, 2, 'paid_only', array['beauty','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@aaliyah.glow',318000),
    (uid,'reels','https://instagram.com/aaliyah.glow',142000);
end $$;

-- Benji Ramos (@benji.pets)
do $$
declare uid uuid := md5('loop-placebo-benji.pets')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'benji.pets@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Benji Ramos"}'::jsonb,
    now() - interval '18 hours', now() - interval '18 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'benji.pets', 'Benji Ramos', 'https://randomuser.me/api/portraits/men/52.jpg', 82,
    'Pet tech, treats, and home-life videos with two rescue dogs and a clean testing format.', 'Tampa, FL', 'away', 'benji.pets@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 16000, 30, 40, 5, 'product_ok', array['pets','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@benji.pets',7900),
    (uid,'reels','https://instagram.com/benji.pets',5400);
end $$;

-- Camille Laurent (@camille.away)
do $$
declare uid uuid := md5('loop-placebo-camille.away')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'camille.away@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Camille Laurent"}'::jsonb,
    now() - interval '19 hours', now() - interval '19 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'camille.away', 'Camille Laurent', 'https://randomuser.me/api/portraits/women/32.jpg', 176,
    'Boutique hotels, luggage, and travel fashion captured in bright, walkable city guides.', 'New Orleans, LA', 'open', 'camille.away@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 78000, 35, 40, 2, 'paid_only', array['travel','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/camille.away',121000),
    (uid,'shorts','https://youtube.com/@camilleaway',39000);
end $$;

-- Omar Bennett (@omar.money)
do $$
declare uid uuid := md5('loop-placebo-omar.money')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'omar.money@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Omar Bennett"}'::jsonb,
    now() - interval '20 hours', now() - interval '20 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'omar.money', 'Omar Bennett', 'https://randomuser.me/api/portraits/men/14.jpg', 128,
    'Plain-English finance and SaaS demos for tools that help people budget, save, and track work.', 'Detroit, MI', 'open', 'omar.money@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 42000, 30, 40, 4, 'paid_only', array['finance','SaaS'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@omar.money',44800),
    (uid,'shorts','https://youtube.com/@omarmoney',18400);
end $$;

-- Nia Patel (@nia.gadgets)
do $$
declare uid uuid := md5('loop-placebo-nia.gadgets')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'nia.gadgets@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Nia Patel"}'::jsonb,
    now() - interval '21 hours', now() - interval '21 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'nia.gadgets', 'Nia Patel', 'https://randomuser.me/api/portraits/women/46.jpg', 198,
    'Smart home, desk gear, and everyday tech reviews with practical setups and clean audio.', 'Minneapolis, MN', 'open', 'nia.gadgets@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 29000, 30, 40, 6, 'product_plus', array['tech','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@niagadgets',24200),
    (uid,'tiktok','https://tiktok.com/@nia.gadgets',15900);
end $$;

-- Elise Morgan (@elise.table)
do $$
declare uid uuid := md5('loop-placebo-elise.table')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'elise.table@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Elise Morgan"}'::jsonb,
    now() - interval '22 hours', now() - interval '22 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'elise.table', 'Elise Morgan', 'https://randomuser.me/api/portraits/women/55.jpg', 28,
    'Family meals, kid snacks, and kitchen products tested in real weekday routines.', 'Kansas City, MO', 'busy', 'elise.table@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 18000, 30, 40, 3, 'product_ok', array['food','parenting'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/elise.table',8700),
    (uid,'tiktok','https://tiktok.com/@elise.table',6300);
end $$;

-- Jayden Price (@jayden.fit)
do $$
declare uid uuid := md5('loop-placebo-jayden.fit')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'jayden.fit@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Jayden Price"}'::jsonb,
    now() - interval '23 hours', now() - interval '23 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'jayden.fit', 'Jayden Price', 'https://randomuser.me/api/portraits/men/61.jpg', 262,
    'Gym apparel, supplements, and recovery products with high-energy edits and clear demos.', 'Las Vegas, NV', 'open', 'jayden.fit@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 125000, 40, 50, 2, 'paid_only', array['fitness','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@jayden.fit',402000),
    (uid,'reels','https://instagram.com/jayden.fit',188000);
end $$;

-- Riley Chen (@riley.rooms)
do $$
declare uid uuid := md5('loop-placebo-riley.rooms')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'riley.rooms@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Riley Chen"}'::jsonb,
    now() - interval '24 hours', now() - interval '24 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'riley.rooms', 'Riley Chen', 'https://randomuser.me/api/portraits/men/88.jpg', 104,
    'Apartment makeovers, renter-friendly DIY, and connected home gear for small spaces.', 'Boston, MA', 'open', 'riley.rooms@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 33000, 30, 40, 5, 'product_plus', array['home','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/riley.rooms',34500),
    (uid,'shorts','https://youtube.com/@rileyrooms',13200);
end $$;

-- Sienna Clarke (@sienna.shares)
do $$
declare uid uuid := md5('loop-placebo-sienna.shares')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'sienna.shares@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Sienna Clarke"}'::jsonb,
    now() - interval '25 hours', now() - interval '25 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'sienna.shares', 'Sienna Clarke', 'https://randomuser.me/api/portraits/women/76.jpg', 314,
    'Local beauty finds, salon visits, and quick product reviews with bright, friendly delivery.', 'Orlando, FL', 'open', 'sienna.shares@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 27000, 30, 40, 6, 'product_plus', array['beauty','local'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@sienna.shares',26100),
    (uid,'reels','https://instagram.com/sienna.shares',17700);
end $$;

-- Malik Johnson (@malik.moves)
do $$
declare uid uuid := md5('loop-placebo-malik.moves')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'malik.moves@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Malik Johnson"}'::jsonb,
    now() - interval '26 hours', now() - interval '26 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'malik.moves', 'Malik Johnson', 'https://randomuser.me/api/portraits/men/22.jpg', 232,
    'Travel workouts, hotel gym reviews, and wellness products filmed on the road.', 'Washington, DC', 'open', 'malik.moves@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 82000, 35, 40, 3, 'paid_only', array['travel','fitness'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@malik.moves',154000),
    (uid,'reels','https://instagram.com/malik.moves',71000);
end $$;

-- Ava Sinclair (@ava.fitcheck)
do $$
declare uid uuid := md5('loop-placebo-ava.fitcheck')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'ava.fitcheck@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Ava Sinclair"}'::jsonb,
    now() - interval '27 hours', now() - interval '27 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'ava.fitcheck', 'Ava Sinclair', 'https://randomuser.me/api/portraits/women/58.jpg', 348,
    'Outfit checks, capsule wardrobes, and beauty pairings for brands that need polished UGC.', 'Scottsdale, AZ', 'open', 'ava.fitcheck@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 70000, 35, 40, 4, 'product_plus', array['fashion','beauty'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/ava.fitcheck',132000),
    (uid,'tiktok','https://tiktok.com/@ava.fitcheck',49800);
end $$;

-- Mateo Rivera (@mateo.local)
do $$
declare uid uuid := md5('loop-placebo-mateo.local')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'mateo.local@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Mateo Rivera"}'::jsonb,
    now() - interval '28 hours', now() - interval '28 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'mateo.local', 'Mateo Rivera', 'https://randomuser.me/api/portraits/men/64.jpg', 42,
    'Neighborhood restaurants, pop-ups, and founder-led food stories with fast turnaround.', 'San Antonio, TX', 'busy', 'mateo.local@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 26000, 30, 40, 4, 'product_plus', array['local','food'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@mateo.local',31200),
    (uid,'reels','https://instagram.com/mateo.local',20500);
end $$;

-- Chloe Nguyen (@chloe.paws)
do $$
declare uid uuid := md5('loop-placebo-chloe.paws')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'chloe.paws@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Chloe Nguyen"}'::jsonb,
    now() - interval '29 hours', now() - interval '29 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'chloe.paws', 'Chloe Nguyen', 'https://randomuser.me/api/portraits/women/83.jpg', 18,
    'Pet lifestyle and local dog-friendly guides with product tests that feel natural.', 'Sacramento, CA', 'open', 'chloe.paws@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 30000, 30, 40, 5, 'product_ok', array['pets','local'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/chloe.paws',38900),
    (uid,'tiktok','https://tiktok.com/@chloe.paws',16600);
end $$;

-- Quinn Foster (@quinn.cash)
do $$
declare uid uuid := md5('loop-placebo-quinn.cash')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'quinn.cash@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Quinn Foster"}'::jsonb,
    now() - interval '30 hours', now() - interval '30 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'quinn.cash', 'Quinn Foster', 'https://randomuser.me/api/portraits/men/34.jpg', 146,
    'Finance apps, creator tools, and workflow software explained without jargon.', 'Philadelphia, PA', 'open', 'quinn.cash@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 62000, 35, 40, 3, 'paid_only', array['finance','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@quinncash',96000),
    (uid,'tiktok','https://tiktok.com/@quinn.cash',58000);
end $$;

-- Layla Hassan (@layla.nest)
do $$
declare uid uuid := md5('loop-placebo-layla.nest')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'layla.nest@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Layla Hassan"}'::jsonb,
    now() - interval '31 hours', now() - interval '31 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'layla.nest', 'Layla Hassan', 'https://randomuser.me/api/portraits/women/91.jpg', 96,
    'Home routines, baby gear, and storage products with calm voiceover and clear before-after shots.', 'Irvine, CA', 'open', 'layla.nest@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 36000, 30, 40, 4, 'product_plus', array['home','parenting'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/layla.nest',46400),
    (uid,'tiktok','https://tiktok.com/@layla.nest',27900);
end $$;

-- Elliot Graves (@elliot.demo)
do $$
declare uid uuid := md5('loop-placebo-elliot.demo')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'elliot.demo@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Elliot Graves"}'::jsonb,
    now() - interval '32 hours', now() - interval '32 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'elliot.demo', 'Elliot Graves', 'https://randomuser.me/api/portraits/men/41.jpg', 222,
    'B2B SaaS demos, screen recordings, and founder-style explainers with conversion-focused scripts.', 'Boulder, CO', 'open', 'elliot.demo@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 85000, 35, 40, 2, 'paid_only', array['SaaS','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@elliotdemo',143000),
    (uid,'tiktok','https://tiktok.com/@elliot.demo',82000);
end $$;

-- Brianna Wells (@bri.wellness)
do $$
declare uid uuid := md5('loop-placebo-bri.wellness')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'bri.wellness@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Brianna Wells"}'::jsonb,
    now() - interval '33 hours', now() - interval '33 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'bri.wellness', 'Brianna Wells', 'https://randomuser.me/api/portraits/women/12.jpg', 286,
    'Wellness, skin prep, supplements, and gym bag essentials with relatable daily routines.', 'Houston, TX', 'open', 'bri.wellness@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 44000, 30, 40, 4, 'product_plus', array['fitness','beauty'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@bri.wellness',49200),
    (uid,'reels','https://instagram.com/bri.wellness',31300);
end $$;

-- Andre Kim (@andre.eats)
do $$
declare uid uuid := md5('loop-placebo-andre.eats')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'andre.eats@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Andre Kim"}'::jsonb,
    now() - interval '34 hours', now() - interval '34 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'andre.eats', 'Andre Kim', 'https://randomuser.me/api/portraits/men/85.jpg', 52,
    'Food tours, hotel breakfasts, and snack taste tests with punchy voiceover and clean captions.', 'Honolulu, HI', 'away', 'andre.eats@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 66000, 35, 40, 2, 'paid_only', array['food','travel'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/andre.eats',104000),
    (uid,'tiktok','https://tiktok.com/@andre.eats',73000);
end $$;

-- Piper Reed (@piper.styled)
do $$
declare uid uuid := md5('loop-placebo-piper.styled')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'piper.styled@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Piper Reed"}'::jsonb,
    now() - interval '35 hours', now() - interval '35 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'piper.styled', 'Piper Reed', 'https://randomuser.me/api/portraits/women/90.jpg', 12,
    'Home styling, outfit links, and decor finds edited for saves, shares, and shopping intent.', 'Cincinnati, OH', 'open', 'piper.styled@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 19000, 30, 40, 6, 'product_ok', array['fashion','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/piper.styled',8400),
    (uid,'tiktok','https://tiktok.com/@piper.styled',5900);
end $$;

-- Isaiah Brooks (@isaiah.fintech)
do $$
declare uid uuid := md5('loop-placebo-isaiah.fintech')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'isaiah.fintech@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Isaiah Brooks"}'::jsonb,
    now() - interval '36 hours', now() - interval '36 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'isaiah.fintech', 'Isaiah Brooks', 'https://randomuser.me/api/portraits/men/45.jpg', 156,
    'Fintech, payroll, and creator-economy tools explained through practical, numbers-first demos.', 'St. Louis, MO', 'open', 'isaiah.fintech@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 39000, 30, 40, 4, 'paid_only', array['tech','finance'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@isaiah.fintech',37500),
    (uid,'shorts','https://youtube.com/@isaiahfintech',21900);
end $$;

-- Daniela Cruz (@dani.glowup)
do $$
declare uid uuid := md5('loop-placebo-dani.glowup')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'dani.glowup@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Daniela Cruz"}'::jsonb,
    now() - interval '37 hours', now() - interval '37 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'dani.glowup', 'Daniela Cruz', 'https://randomuser.me/api/portraits/women/5.jpg', 318,
    'Clean-girl beauty, skin prep, and fragrance content with soft natural light and honest reviews.', 'Austin, TX', 'open', 'dani.glowup@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 47000, 35, 40, 4, 'product_plus', array['beauty','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/dani.glowup',52800),
    (uid,'tiktok','https://tiktok.com/@dani.glowup',34100);
end $$;

-- Kevin Tran (@kev.builds)
do $$
declare uid uuid := md5('loop-placebo-kev.builds')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'kev.builds@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Kevin Tran"}'::jsonb,
    now() - interval '38 hours', now() - interval '38 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'kev.builds', 'Kevin Tran', 'https://randomuser.me/api/portraits/men/6.jpg', 208,
    'Dev-tool demos, AI workflow breakdowns, and SaaS explainers for technical audiences.', 'Seattle, WA', 'open', 'kev.builds@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 78000, 35, 40, 3, 'paid_only', array['tech','SaaS'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@kevbuilds',124000),
    (uid,'tiktok','https://tiktok.com/@kev.builds',58700);
end $$;

-- Marisol Vega (@marisol.eats)
do $$
declare uid uuid := md5('loop-placebo-marisol.eats')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'marisol.eats@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Marisol Vega"}'::jsonb,
    now() - interval '39 hours', now() - interval '39 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'marisol.eats', 'Marisol Vega', 'https://randomuser.me/api/portraits/women/15.jpg', 32,
    'Latin home cooking, CPG taste tests, and recipe reels with bright, appetizing close-ups.', 'San Antonio, TX', 'busy', 'marisol.eats@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 33000, 30, 40, 5, 'product_plus', array['food','local'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/marisol.eats',41600),
    (uid,'tiktok','https://tiktok.com/@marisol.eats',28900);
end $$;

-- Marcus Bell (@marcus.moves)
do $$
declare uid uuid := md5('loop-placebo-marcus.moves')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'marcus.moves@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Marcus Bell"}'::jsonb,
    now() - interval '40 hours', now() - interval '40 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'marcus.moves', 'Marcus Bell', 'https://randomuser.me/api/portraits/men/13.jpg', 256,
    'Strength training, supplements, and recovery gear demoed in real sessions, not staged sets.', 'Dallas, TX', 'open', 'marcus.moves@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 118000, 40, 50, 2, 'paid_only', array['fitness','fashion'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@marcus.moves',268000),
    (uid,'reels','https://instagram.com/marcus.moves',141000);
end $$;

-- June Park (@june.styled)
do $$
declare uid uuid := md5('loop-placebo-june.styled')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'june.styled@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"June Park"}'::jsonb,
    now() - interval '41 hours', now() - interval '41 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'june.styled', 'June Park', 'https://randomuser.me/api/portraits/women/23.jpg', 12,
    'Capsule wardrobes, outfit links, and try-on hauls edited for saves and shopping intent.', 'Brooklyn, NY', 'open', 'june.styled@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 58000, 35, 40, 4, 'product_plus', array['fashion','beauty'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/june.styled',88400),
    (uid,'tiktok','https://tiktok.com/@june.styled',46200);
end $$;

-- DeShawn Carter (@deshawn.money)
do $$
declare uid uuid := md5('loop-placebo-deshawn.money')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'deshawn.money@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"DeShawn Carter"}'::jsonb,
    now() - interval '42 hours', now() - interval '42 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'deshawn.money', 'DeShawn Carter', 'https://randomuser.me/api/portraits/men/17.jpg', 142,
    'Budgeting apps, credit tools, and fintech demos in plain English with numbers-first scripts.', 'Atlanta, GA', 'open', 'deshawn.money@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 49000, 30, 40, 3, 'paid_only', array['finance','SaaS'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@deshawn.money',63500),
    (uid,'shorts','https://youtube.com/@deshawnmoney',29400);
end $$;

-- Hannah Nguyen (@the.nguyens)
do $$
declare uid uuid := md5('loop-placebo-the.nguyens')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'the.nguyens@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Hannah Nguyen"}'::jsonb,
    now() - interval '43 hours', now() - interval '43 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'the.nguyens', 'Hannah Nguyen', 'https://randomuser.me/api/portraits/women/28.jpg', 96,
    'Family routines, baby gear, and home organization tested by two toddlers and a tired mom.', 'Portland, OR', 'open', 'the.nguyens@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 35000, 30, 40, 4, 'product_plus', array['parenting','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/the.nguyens',44900),
    (uid,'tiktok','https://tiktok.com/@the.nguyens',31700);
end $$;

-- Rory Sullivan (@rory.roams)
do $$
declare uid uuid := md5('loop-placebo-rory.roams')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'rory.roams@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Rory Sullivan"}'::jsonb,
    now() - interval '44 hours', now() - interval '44 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'rory.roams', 'Rory Sullivan', 'https://randomuser.me/api/portraits/men/24.jpg', 188,
    'Budget travel, carry-on gear, and booking-app demos shot across real city itineraries.', 'Denver, CO', 'away', 'rory.roams@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 64000, 35, 40, 2, 'paid_only', array['travel','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@roryroams',97000),
    (uid,'reels','https://instagram.com/rory.roams',52300);
end $$;

-- Tasha Okonkwo (@pawsby.tasha)
do $$
declare uid uuid := md5('loop-placebo-pawsby.tasha')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'pawsby.tasha@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Tasha Okonkwo"}'::jsonb,
    now() - interval '45 hours', now() - interval '45 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'pawsby.tasha', 'Tasha Okonkwo', 'https://randomuser.me/api/portraits/women/38.jpg', 22,
    'Pet products, treat taste tests, and training content with one very food-motivated corgi.', 'Charlotte, NC', 'open', 'pawsby.tasha@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 34000, 30, 40, 5, 'product_plus', array['pets','home'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@pawsby.tasha',56100),
    (uid,'reels','https://instagram.com/pawsby.tasha',33800);
end $$;

-- Felix Andersson (@fixit.felix)
do $$
declare uid uuid := md5('loop-placebo-fixit.felix')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'fixit.felix@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Felix Andersson"}'::jsonb,
    now() - interval '46 hours', now() - interval '46 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'fixit.felix', 'Felix Andersson', 'https://randomuser.me/api/portraits/men/33.jpg', 88,
    'Renter-friendly DIY, tool reviews, and small-space upgrades with clear step-by-step b-roll.', 'Minneapolis, MN', 'open', 'fixit.felix@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 31000, 30, 40, 4, 'product_ok', array['home','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@fixitfelix',38200),
    (uid,'tiktok','https://tiktok.com/@fixit.felix',19600);
end $$;

-- Beatriz Lima (@bites.with.bea)
do $$
declare uid uuid := md5('loop-placebo-bites.with.bea')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'bites.with.bea@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Beatriz Lima"}'::jsonb,
    now() - interval '47 hours', now() - interval '47 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'bites.with.bea', 'Beatriz Lima', 'https://randomuser.me/api/portraits/women/42.jpg', 44,
    'Local restaurant features, pop-ups, and founder food stories with fast, punchy edits.', 'Miami, FL', 'busy', 'bites.with.bea@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 26000, 30, 40, 5, 'product_plus', array['local','food'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'reels','https://instagram.com/bites.with.bea',29300),
    (uid,'tiktok','https://tiktok.com/@bites.with.bea',18400);
end $$;

-- Arjun Mehta (@arjun.demos)
do $$
declare uid uuid := md5('loop-placebo-arjun.demos')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'arjun.demos@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Arjun Mehta"}'::jsonb,
    now() - interval '48 hours', now() - interval '48 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'arjun.demos', 'Arjun Mehta', 'https://randomuser.me/api/portraits/men/40.jpg', 224,
    'B2B SaaS walkthroughs, onboarding screen-records, and founder explainers built to convert.', 'San Jose, CA', 'open', 'arjun.demos@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 86000, 35, 40, 2, 'paid_only', array['SaaS','tech'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'shorts','https://youtube.com/@arjundemos',156000),
    (uid,'tiktok','https://tiktok.com/@arjun.demos',71500);
end $$;

-- Wren Adebayo (@wellness.wren)
do $$
declare uid uuid := md5('loop-placebo-wellness.wren')::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'wellness.wren@placebo.loop', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"creator","name":"Wren Adebayo"}'::jsonb,
    now() - interval '49 hours', now() - interval '49 hours',
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, role, handle, name, avatar_url, avatar_hue, bio, location, status, email)
  values (uid, 'creator', 'wellness.wren', 'Wren Adebayo', 'https://randomuser.me/api/portraits/women/48.jpg', 292,
    'Wellness routines, skin prep, and gym-bag essentials with relatable, low-pressure delivery.', 'Chicago, IL', 'open', 'wellness.wren@placebo.loop')
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, avatar_url = excluded.avatar_url,
    avatar_hue = excluded.avatar_hue, bio = excluded.bio, location = excluded.location, status = excluded.status;

  insert into public.creator_details (profile_id, base_rate_cents, usage_upcharge_pct, raw_upcharge_pct, capacity_per_week, compensation_pref, niches)
  values (uid, 45000, 30, 40, 4, 'product_plus', array['fitness','beauty'])
  on conflict (profile_id) do update set
    base_rate_cents = excluded.base_rate_cents, usage_upcharge_pct = excluded.usage_upcharge_pct,
    raw_upcharge_pct = excluded.raw_upcharge_pct, capacity_per_week = excluded.capacity_per_week,
    compensation_pref = excluded.compensation_pref, niches = excluded.niches;

  delete from public.creator_platforms where creator_id = uid;
  insert into public.creator_platforms (creator_id, platform, url, follower_count) values
    (uid,'tiktok','https://tiktok.com/@wellness.wren',50400),
    (uid,'reels','https://instagram.com/wellness.wren',36900);
end $$;
