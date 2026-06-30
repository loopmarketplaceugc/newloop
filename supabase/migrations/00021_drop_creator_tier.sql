-- Remove the creator tier concept entirely. Reach (total follower count) and
-- platforms now stand in for the old nano/micro/mid/elite tier everywhere in the UI.
alter table creator_details drop column if exists tier;
