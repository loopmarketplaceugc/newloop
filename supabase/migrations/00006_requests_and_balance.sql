ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance_cents integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  platforms text[] NOT NULL DEFAULT '{}',
  num_creators integer NOT NULL DEFAULT 1,
  reels_per_creator integer NOT NULL DEFAULT 1,
  pay_per_creator_cents integer NOT NULL DEFAULT 0,
  deadline_at timestamptz,
  merch_included boolean NOT NULL DEFAULT false,
  merch_description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, creator_id)
);
