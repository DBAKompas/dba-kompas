-- ─────────────────────────────────────────────────────────────────────────────
-- Migratie 013: Reward verloop
-- Aangemaakt: 2026-05-06
-- Voegt expires_at, expired_at, reminded_at toe aan referral_rewards
-- en backfillt bestaande rijen op basis van reward_type.
--
-- Termijnen per type:
--   free_check          → 30 dagen
--   month_discount      → 60 dagen
--   two_month_discount  → 60 dagen
-- Onbekende types blijven NULL (geen verloop).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Kolommen toevoegen
ALTER TABLE public.referral_rewards
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS expired_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reminded_at timestamptz;

-- 2. Backfill expires_at op bestaande rijen
UPDATE public.referral_rewards
   SET expires_at = granted_at + INTERVAL '30 days'
 WHERE expires_at IS NULL
   AND reward_type = 'free_check';

UPDATE public.referral_rewards
   SET expires_at = granted_at + INTERVAL '60 days'
 WHERE expires_at IS NULL
   AND reward_type IN ('month_discount', 'two_month_discount');

-- 3. Index voor de cron-query (vindt verlopende of te-rappelleren rewards)
CREATE INDEX IF NOT EXISTS referral_rewards_expires_at_idx
  ON public.referral_rewards (expires_at)
  WHERE expires_at IS NOT NULL AND expired_at IS NULL;
