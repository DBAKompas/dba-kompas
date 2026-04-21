-- ============================================================
-- Migratie 007: Usage counters (KI-021)
-- Uitvoeren in: Supabase Studio > SQL Editor
--
-- Doel:
--   Harde cap op het aantal DBA-analyses per kalendermaand per
--   gebruiker. Voorkomt ongecontroleerde AI-kosten bij misbruik
--   (bot, gedeelde accounts). Quota wordt per plan bepaald in
--   code (modules/usage/quota-config.ts), niet in de DB:
--     - monthly:  20 checks / maand
--     - yearly:   25 checks / maand
--     - one_time:  1 check totaal
--   Reset gebeurt impliciet: per kalendermaand bestaat er maximaal
--   één rij per gebruiker (UNIQUE op user_id + period_start). Een
--   nieuwe maand = nieuwe rij wordt lazy aangemaakt bij eerste
--   increment via de RPC-functie hieronder.
--
-- Beveiliging:
--   - Writes uitsluitend via service_role (supabaseAdmin).
--   - Authenticated users mogen ALLEEN hun eigen usage lezen (voor
--     UsageMeter op dashboard).
--   - De atomic increment gebeurt in Postgres zelf om race
--     condities bij parallelle requests onmogelijk te maken.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,       -- altijd de eerste van de kalendermaand
  checks_used   INT  NOT NULL DEFAULT 0 CHECK (checks_used >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS usage_counters_user_period_idx
  ON public.usage_counters (user_id, period_start DESC);

-- updated_at auto-onderhouden
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usage_counters_set_updated_at ON public.usage_counters;
CREATE TRIGGER usage_counters_set_updated_at
  BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Atomic increment met quota-check
--   Retourneert de nieuwe stand van checks_used als de increment
--   is doorgegaan. Returnt NULL als de gebruiker al op het limiet
--   zit, zodat de caller een 429 kan teruggeven.
--   Race-safe: INSERT ON CONFLICT + conditional UPDATE.
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_usage_if_under_quota(
  p_user_id       UUID,
  p_period_start  DATE,
  p_quota_limit   INT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count INT;
BEGIN
  -- Zorg dat er een rij bestaat voor deze maand. INSERT met ON
  -- CONFLICT DO NOTHING is idempotent.
  INSERT INTO public.usage_counters (user_id, period_start, checks_used)
  VALUES (p_user_id, p_period_start, 0)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  -- Atomic conditional update: alleen verhogen als we onder quota zitten.
  UPDATE public.usage_counters
     SET checks_used = checks_used + 1
   WHERE user_id      = p_user_id
     AND period_start = p_period_start
     AND checks_used  < p_quota_limit
  RETURNING checks_used INTO v_new_count;

  -- NULL = quota bereikt, UPDATE raakte 0 rijen
  RETURN v_new_count;
END;
$$;

-- Service role mag RPC aanroepen; authenticated users niet direct.
REVOKE ALL ON FUNCTION public.increment_usage_if_under_quota(UUID, DATE, INT) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_usage_if_under_quota(UUID, DATE, INT) TO service_role;

-- ============================================================
-- Compensating decrement (voor wanneer AI-call faalt na reservatie)
-- ============================================================
CREATE OR REPLACE FUNCTION public.release_usage_reservation(
  p_user_id       UUID,
  p_period_start  DATE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_counters
     SET checks_used = GREATEST(checks_used - 1, 0)
   WHERE user_id      = p_user_id
     AND period_start = p_period_start;
END;
$$;

REVOKE ALL ON FUNCTION public.release_usage_reservation(UUID, DATE) FROM public;
GRANT EXECUTE ON FUNCTION public.release_usage_reservation(UUID, DATE) TO service_role;

-- ============================================================
-- RLS: eigen rij lezen mag, writes alleen via service_role
-- ============================================================
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_counters_select_own" ON public.usage_counters;
CREATE POLICY "usage_counters_select_own"
  ON public.usage_counters
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Geen INSERT/UPDATE/DELETE policies: authenticated kan niets schrijven.
-- service_role bypass RLS en regelt alle writes.
