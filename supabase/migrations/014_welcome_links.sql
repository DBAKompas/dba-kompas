-- ============================================================
-- Migratie 014: Welcome links (admin share-links)
-- Uitvoeren in: Supabase Studio > SQL Editor
--
-- Doel:
--   Reproduceerbare definitie van de welcome_links tabel.
--   Elke rij representeert een deelbare onboarding-link
--   (https://dbakompas.nl/c/<token>) die door een admin is
--   aangemaakt en gekoppeld is aan een welcome-code in
--   referral_codes. Bij redemption wordt de link gemarkeerd
--   met used_at en used_by.
--
-- Beveiliging:
--   - RLS aan, geen policies: alle reads/writes via
--     supabaseAdmin (service role) in server-side code.
--   - Geen anon/authenticated access.
--
-- Productie:
--   Tabel bestaat al in productie. Deze migratie is
--   idempotent (IF NOT EXISTS) en bestaat puur voor
--   reproduceerbaarheid op lokale en staging databases.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.welcome_links (
  token          TEXT PRIMARY KEY,
  referral_code  TEXT NOT NULL UNIQUE
                   REFERENCES public.referral_codes(code) ON DELETE RESTRICT,
  campaign_label TEXT NOT NULL DEFAULT 'LINKEDIN-GRATIS-CHECK',
  created_by     UUID NOT NULL REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ,
  used_at        TIMESTAMPTZ,
  used_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS welcome_links_campaign_idx
  ON public.welcome_links (campaign_label, created_at DESC);

ALTER TABLE public.welcome_links ENABLE ROW LEVEL SECURITY;
