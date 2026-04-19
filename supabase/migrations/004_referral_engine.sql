-- ─────────────────────────────────────────────────────────────────────────────
-- Migratie 004: Referral engine
-- Aangemaakt: 2026-04-18
-- Uitvoeren via: Supabase Studio → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Referral codes: één per gebruiker, persistent
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text        NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Gebruiker kan eigen code lezen
CREATE POLICY "Users can read own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Reward ledger: idempotent, nooit overschrijven
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid        NOT NULL REFERENCES auth.users(id),
  referred_id     uuid        NOT NULL REFERENCES auth.users(id),
  milestone       int         NOT NULL,         -- 1, 3 of 5
  reward_type     text        NOT NULL,         -- 'free_check' | 'month_discount'
  stripe_coupon_id text,
  granted_at      timestamptz DEFAULT now(),
  UNIQUE (referrer_id, milestone)               -- één reward per milestone per referrer
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Gebruiker kan eigen rewards lezen
CREATE POLICY "Users can read own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = referrer_id);

-- 3. Referral tracking: van landing tot checkout
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code     text        NOT NULL,
  referrer_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status            text        DEFAULT 'pending',  -- pending | qualified | rewarded | fraud
  checkout_session_id text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (referred_user_id)                         -- één referrer per referred user
);

ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;

-- Geen directe user toegang nodig — alleen server-side admin
-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS referral_tracking_referrer_idx ON public.referral_tracking (referrer_id);
CREATE INDEX IF NOT EXISTS referral_tracking_code_idx ON public.referral_tracking (referral_code);
CREATE INDEX IF NOT EXISTS referral_codes_code_idx ON public.referral_codes (code);
