-- ============================================================
-- Migratie 010: Referral systeem — 5 codes per gebruiker
-- Uitvoeren in: Supabase Studio > SQL Editor
-- ============================================================
--
-- Wijzigingen:
--   1) UNIQUE constraint op referral_codes.user_id verwijderd
--      zodat elke gebruiker maximaal 5 codes kan hebben.
--   2) is_used, used_by, used_at kolommen toegevoegd per code.

-- Stap 1: UNIQUE constraint op user_id verwijderen
ALTER TABLE public.referral_codes
  DROP CONSTRAINT IF EXISTS referral_codes_user_id_key;

-- Stap 2: kolommen toevoegen
ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS is_used   boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS used_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS used_at   timestamptz;

-- Stap 3: index voor snel opzoeken van beschikbare codes per user
CREATE INDEX IF NOT EXISTS referral_codes_user_available_idx
  ON public.referral_codes (user_id, is_used);
