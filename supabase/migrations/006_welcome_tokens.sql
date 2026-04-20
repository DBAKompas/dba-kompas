-- ============================================================
-- Migratie 006: Welcome tokens (KI-020-A)
-- Uitvoeren in: Supabase Studio > SQL Editor
--
-- Doel:
--   Elke welkomstmail bevat een prefetch-proof token dat verwijst
--   naar /auth/activate/<token> of /auth/welcome/<token>. Het token
--   zelf is HMAC-signed (zie lib/auth/welcome-token.ts), maar we
--   loggen de uitgifte + het gebruik in deze tabel zodat we kunnen
--   traceren en revoken wat er gebeurt post-payment.
--
-- Beveiliging:
--   - Geen public access. Alle writes/reads via supabaseAdmin
--     (service role) in server-side code.
--   - RLS aan, geen policies: niemand mag via anon of authenticated
--     client bij deze tabel.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.welcome_tokens (
  jti          UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  used_ip      TEXT,
  used_purpose TEXT,       -- 'activate' | 'magiclink' — welk pad heeft de klant gekozen
  revoked_at   TIMESTAMPTZ,
  revoke_reason TEXT
);

-- Snelle lookup per user (voor revocation van uitstaande tokens)
CREATE INDEX IF NOT EXISTS welcome_tokens_user_id_idx
  ON public.welcome_tokens (user_id);

-- Snelle lookup per e-mail (voor support/debug)
CREATE INDEX IF NOT EXISTS welcome_tokens_email_idx
  ON public.welcome_tokens (email);

-- Alleen openstaande/niet-verlopen tokens kunnen nog gebruikt worden
CREATE INDEX IF NOT EXISTS welcome_tokens_active_idx
  ON public.welcome_tokens (expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.welcome_tokens ENABLE ROW LEVEL SECURITY;

-- Geen policies: service role bypass RLS en niemand anders mag bij de tabel.
