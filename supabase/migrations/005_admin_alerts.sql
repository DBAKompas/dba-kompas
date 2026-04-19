-- ============================================================
-- Migratie 005: Admin alerts
-- Uitvoeren in: Supabase Studio > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL,           -- bijv. 'payment_failed', 'cron_failed', 'analysis_error'
  severity      TEXT NOT NULL DEFAULT 'warning',  -- 'info' | 'warning' | 'critical'
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',      -- extra context: user_id, subscription_id, etc.
  resolved      BOOLEAN NOT NULL DEFAULT false,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES auth.users(id),
  email_sent    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index voor het snel ophalen van openstaande alerts
CREATE INDEX IF NOT EXISTS admin_alerts_resolved_created
  ON public.admin_alerts (resolved, created_at DESC);

-- RLS: alleen leesbaar/schrijfbaar via service role (admin client)
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Geen publieke toegang — alles loopt via supabaseAdmin in server-side code
