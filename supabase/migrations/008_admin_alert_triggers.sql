-- ============================================================
-- Migratie 008: Admin alert triggers (INFRA-002 vervolg)
-- Uitvoeren in: Supabase Studio > SQL Editor
--
-- Doel:
--   Uitbreiding van admin_alerts (migratie 005) met:
--     1) Een append-only event-log (alert_events) waar de app
--        "interessante" events in schrijft: quota-weigering,
--        AI-analyse fout, admin-promotie.
--     2) Een Postgres-trigger op profiles die bij promotie
--        naar role='admin' automatisch een critical alert logt
--        plus het bijbehorende event vastlegt.
--
-- Beveiliging:
--   - Tabel heeft RLS aan zonder policies: alleen service_role
--     kan lezen/schrijven (gebruikt door app + trigger).
--   - Trigger gebruikt SECURITY DEFINER met search_path=public.
-- ============================================================

-- ------------------------------------------------------------
-- Event log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL
    CHECK (event_type IN ('quota_denied', 'analysis_error', 'admin_promoted')),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alert_events_type_user_time_idx
  ON public.alert_events (event_type, user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS alert_events_type_time_idx
  ON public.alert_events (event_type, occurred_at DESC);

ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
-- Geen policies. Alleen service_role (bypass) mag reads/writes doen.

-- ------------------------------------------------------------
-- Trigger: security-alert bij promotie naar admin
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admin_role_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Alleen reageren bij transitie naar 'admin'. Als oude rol al
  -- admin was, is er niets veranderd en geen alert nodig.
  IF NEW.role = 'admin' AND COALESCE(OLD.role, 'user') <> 'admin' THEN
    -- Event log
    INSERT INTO public.alert_events (event_type, user_id, metadata)
    VALUES (
      'admin_promoted',
      NEW.user_id,
      jsonb_build_object(
        'previous_role', COALESCE(OLD.role, 'user'),
        'new_role', NEW.role,
        'profile_id', NEW.id,
        'email', NEW.email
      )
    );

    -- Critical alert met mail aan admin. De app-laag zal dit
    -- oppikken via admin_alerts; email_sent wordt later door de
    -- app-laag ge-update indien de mail via Postmark uitgaat.
    INSERT INTO public.admin_alerts (type, severity, title, message, metadata)
    VALUES (
      'general',
      'critical',
      'Nieuwe admin-rol toegekend',
      'Een gebruiker heeft de admin-rol gekregen. Verifieer dat deze promotie bewust is.',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'email', NEW.email,
        'previous_role', COALESCE(OLD.role, 'user')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_notify_admin_promotion ON public.profiles;
CREATE TRIGGER profiles_notify_admin_promotion
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_role_promotion();

-- Edge case: rechtstreekse INSERT met role='admin' (bijv. seed).
-- Ook die willen we vastleggen.
CREATE OR REPLACE FUNCTION public.notify_admin_role_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.alert_events (event_type, user_id, metadata)
    VALUES (
      'admin_promoted',
      NEW.user_id,
      jsonb_build_object(
        'previous_role', 'insert',
        'new_role', NEW.role,
        'profile_id', NEW.id,
        'email', NEW.email
      )
    );

    INSERT INTO public.admin_alerts (type, severity, title, message, metadata)
    VALUES (
      'general',
      'critical',
      'Nieuwe admin-rol toegekend (insert)',
      'Er is een profiel aangemaakt met role=admin. Verifieer dat deze promotie bewust is.',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'email', NEW.email,
        'source', 'profile_insert'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_notify_admin_insert ON public.profiles;
CREATE TRIGGER profiles_notify_admin_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_role_insert();

-- ------------------------------------------------------------
-- Helper view: 429-tellers over de laatste 24u per user
-- (niet strikt nodig; app-laag query's werken ook via tabel,
--  maar een view maakt ad-hoc inspectie in Supabase Studio makkelijker)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_recent_quota_denials AS
  SELECT
    user_id,
    COUNT(*)::int AS denials_24h,
    MAX(occurred_at) AS last_denial_at
  FROM public.alert_events
  WHERE event_type = 'quota_denied'
    AND occurred_at >= now() - interval '24 hours'
  GROUP BY user_id;

REVOKE ALL ON public.v_recent_quota_denials FROM public;
GRANT SELECT ON public.v_recent_quota_denials TO service_role;
