-- Creator profile analyzer metrics.

alter table creator_platforms add column if not exists post_count integer;
alter table creator_platforms add column if not exists average_views integer;
