-- Stripe Connect columns for creator payout onboarding.
-- stripe_account_id  — Express account id minted at onboarding time
-- stripe_payouts_enabled — flipped true by the account.updated webhook once Stripe clears the creator
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;
