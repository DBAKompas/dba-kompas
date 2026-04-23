-- ============================================================
-- 009_test_results.sql
-- Testmodule: resultaten + issues per testcase bijhouden
-- Alleen admin heeft toegang (via service_role of RLS op role)
-- ============================================================

-- ── test_results ────────────────────────────────────────────
-- Één rij per testcase-id. Status: pending | passed | failed
CREATE TABLE IF NOT EXISTS public.test_results (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     text        NOT NULL UNIQUE,           -- bijv. "auth-001"
  status      text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','failed')),
  notes       text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role beheert test_results"
  ON public.test_results FOR ALL
  USING (auth.role() = 'service_role');

-- Admins mogen lezen en schrijven
CREATE POLICY "Admins mogen test_results lezen"
  ON public.test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins mogen test_results bijwerken"
  ON public.test_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── test_issues ─────────────────────────────────────────────
-- Gemelde issues inclusief gegenereerde prompt voor Claude
CREATE TABLE IF NOT EXISTS public.test_issues (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     text        NOT NULL,
  description text        NOT NULL,
  prompt      text        NOT NULL,
  status      text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.test_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role beheert test_issues"
  ON public.test_issues FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins mogen test_issues lezen"
  ON public.test_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins mogen test_issues aanmaken en bijwerken"
  ON public.test_issues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Index voor snelle lookup per testcase
CREATE INDEX IF NOT EXISTS idx_test_issues_test_id ON public.test_issues(test_id);
CREATE INDEX IF NOT EXISTS idx_test_issues_status  ON public.test_issues(status);
