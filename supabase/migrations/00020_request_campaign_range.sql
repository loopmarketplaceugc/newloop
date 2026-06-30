-- Replace the single deadline with a campaign date range on requests.
-- deadline_at is kept (populated with the campaign end date) for backward
-- compatibility with existing rows and the gig-creation path on approval.

ALTER TABLE requests ADD COLUMN IF NOT EXISTS campaign_start_at timestamptz;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS campaign_end_at timestamptz;

-- Backfill: existing rows treat their deadline as the campaign end date.
UPDATE requests
  SET campaign_end_at = deadline_at
  WHERE campaign_end_at IS NULL AND deadline_at IS NOT NULL;
