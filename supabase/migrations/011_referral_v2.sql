-- ============================================================
-- Migratie 011: Referral & Upgrade Mechaniek v2
-- Datum: 2026-05-05
-- Uitvoeren in: Supabase Studio > SQL Editor
--
-- Doel:
--   Additieve uitbreiding op het bestaande referral-systeem (004 + 010):
--   - onderscheid welkomscode vs deelcode
--   - 30 dagen geldigheid op deelcodes
--   - 60-dagen staffeltimer (nieuwe tabel)
--   - 14-dagen upgrade-aanbod na eenmalige check (nieuwe tabel)
--   - tracking-velden 12 t/m 20 op profiles
--   - fingerprint-velden op referral_tracking voor misbruikdetectie
--   - cohort-view voor wekelijkse rapportage
--
-- Verwijdert NIETS. Bestaande engine, coupons en tabellen blijven werken.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. Uitbreiding referral_codes
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS code_type   text NOT NULL DEFAULT 'share'
    CHECK (code_type IN ('welcome', 'share')),
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS issuer_role text NOT NULL DEFAULT 'user'
    CHECK (issuer_role IN ('user', 'admin'));

-- Backfill: alle bestaande codes (allemaal share-codes) krijgen
-- een verloopdatum 30 dagen vanaf NU, zodat geen bestaande live
-- code per ongeluk ongeldig wordt door deze migratie.
UPDATE public.referral_codes
   SET expires_at = now() + interval '30 days'
 WHERE expires_at IS NULL;

-- Vanaf nu willen we expires_at NOT NULL voor share-codes,
-- maar we forceren dat niet via een constraint omdat welkomscodes
-- (admin-issued) optioneel een open einde mogen hebben.
-- De engine zorgt dat share-codes altijd een waarde krijgen.

CREATE INDEX IF NOT EXISTS referral_codes_expiry_idx
  ON public.referral_codes (expires_at)
  WHERE is_used = false;

CREATE INDEX IF NOT EXISTS referral_codes_type_user_idx
  ON public.referral_codes (user_id, code_type);

-- ──────────────────────────────────────────────────────────
-- 2. Nieuwe tabel: referral_staffel (60-dagen-window per gever)
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_staffel (
  user_id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at         timestamptz,                    -- moment van eerste qualified referral
  expires_at         timestamptz,                    -- started_at + 60 dagen
  successful_count   int         NOT NULL DEFAULT 0,
  highest_milestone  int         NOT NULL DEFAULT 0,
  last_evaluated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_staffel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own staffel"
  ON public.referral_staffel FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages staffel"
  ON public.referral_staffel FOR ALL
  USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────
-- 3. Nieuwe tabel: upgrade_offers (14-dagen aanbod na eenmalige check)
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.upgrade_offers (
  user_id                  uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at             timestamptz NOT NULL DEFAULT now(),
  expires_at               timestamptz NOT NULL,
  coupon_code              text        NOT NULL DEFAULT 'UPGRADE_FIRST_MONTH_995',
  accepted_at              timestamptz,
  accepted_subscription_id uuid        REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  CHECK (expires_at > triggered_at)
);

ALTER TABLE public.upgrade_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own upgrade offer"
  ON public.upgrade_offers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages upgrade offers"
  ON public.upgrade_offers FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS upgrade_offers_expiry_idx
  ON public.upgrade_offers (expires_at)
  WHERE accepted_at IS NULL;

-- ──────────────────────────────────────────────────────────
-- 4. Aanvulling profiles (datapunten 12 t/m 20 uit v2-document)
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS share_codes_redeemed         int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_successful_referral_at timestamptz,
  ADD COLUMN IF NOT EXISTS highest_milestone_reached    int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgrade_status               text        NOT NULL DEFAULT 'none'
    CHECK (upgrade_status IN ('none','offered','clicked','upgraded_month','upgraded_year','canceled')),
  ADD COLUMN IF NOT EXISTS first_subscription_at        timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_canceled_at     timestamptz,
  ADD COLUMN IF NOT EXISTS lifetime_value_cents         bigint      NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────────────────────
-- 5. Aanvulling referral_tracking (misbruikdetectie + redemption_kind)
-- ──────────────────────────────────────────────────────────

ALTER TABLE public.referral_tracking
  ADD COLUMN IF NOT EXISTS redeemer_email_domain text,
  ADD COLUMN IF NOT EXISTS redeemer_ip_hash      text,
  ADD COLUMN IF NOT EXISTS redemption_kind       text
    CHECK (redemption_kind IN ('one_time', 'subscription'));

CREATE INDEX IF NOT EXISTS referral_tracking_email_domain_idx
  ON public.referral_tracking (referrer_id, redeemer_email_domain);

CREATE INDEX IF NOT EXISTS referral_tracking_ip_hash_idx
  ON public.referral_tracking (redeemer_ip_hash, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- 6. View voor cohort-rapportage
-- ──────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.referral_cohorts AS
SELECT
  p.user_id,
  p.id                                   AS profile_id,
  date_trunc('week', p.created_at)::date AS signup_week,
  p.share_codes_redeemed,
  p.highest_milestone_reached,
  p.upgrade_status,
  p.first_subscription_at,
  p.subscription_canceled_at,
  p.lifetime_value_cents
FROM public.profiles p;

-- View toegankelijk via service_role (voor admin-rapportage).
-- Geen RLS op views: de onderliggende profiles-tabel handhaaft RLS.

-- ============================================================
-- KLAAR. Geen bestaande tabel of policy verwijderd.
-- ============================================================
