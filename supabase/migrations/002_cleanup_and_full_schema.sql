-- ============================================================
-- DBA Kompas – Cleanup SaaS Starter tabellen + volledig schema
-- Veilig uitvoeren: alle tabellen waren leeg (count = 0)
-- ============================================================

-- --------------------------------------------------------
-- Stap 1: Verwijder de SaaS Starter tabellen
-- (CASCADE verwijdert ook afhankelijke policies en triggers)
-- --------------------------------------------------------
DROP TABLE IF EXISTS public.entitlements CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.account_members CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;

-- --------------------------------------------------------
-- 1. profiles  (extends auth.users)
-- --------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  user_type text NOT NULL DEFAULT 'zzp',
  plan_preference text DEFAULT 'monthly',
  subscription_status text DEFAULT 'none',
  stripe_customer_id text,
  marketing_opt_in boolean DEFAULT false,
  bedrijfstak text,
  specialisatie text,
  nieuws_voorkeuren jsonb DEFAULT '{}',
  notificatie_instellingen jsonb DEFAULT '{}',
  dashboard_layout text DEFAULT 'default',
  taal_voorkeur text DEFAULT 'nl',
  email_digest_enabled boolean DEFAULT true,
  email_digest_frequency text DEFAULT 'weekly',
  last_email_digest_sent timestamptz,
  mfa_enabled boolean DEFAULT false,
  mfa_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 2. news_items  (public read, geen user_id)
-- --------------------------------------------------------
CREATE TABLE public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  impact text NOT NULL,
  is_new boolean DEFAULT true,
  source text,
  source_url text,
  source_reliable boolean DEFAULT true,
  relevant_for jsonb DEFAULT '[]',
  relevance_reason text,
  content_hash text,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news"
  ON public.news_items FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage news"
  ON public.news_items FOR ALL
  USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- 3. user_news_feedback
-- --------------------------------------------------------
CREATE TABLE public.user_news_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_item_id uuid NOT NULL REFERENCES public.news_items(id) ON DELETE CASCADE,
  is_relevant boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, news_item_id)
);

ALTER TABLE public.user_news_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
  ON public.user_news_feedback FOR ALL
  USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 4. documents
-- --------------------------------------------------------
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_content text NOT NULL,
  processed_content text,
  status text NOT NULL DEFAULT 'processing',
  ai_analysis jsonb,
  suggestions text,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 5. notifications
-- --------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  related_item_id uuid,
  related_item_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 6. subscriptions
-- --------------------------------------------------------
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'incomplete',
  plan text NOT NULL DEFAULT 'monthly',
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  payment_failed boolean DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- 7. billing_events  (idempotent webhook processing)
-- --------------------------------------------------------
CREATE TABLE public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.billing_events FOR ALL
  USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- 8. dba_assessments
-- --------------------------------------------------------
CREATE TABLE public.dba_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text text NOT NULL,
  is_dba_proof boolean,
  besluit text,
  score integer,
  score_color text,
  is_lijnfunctie boolean,
  samenvatting_1_zin text,
  samenvatting_opdracht text,
  samenvatting_analyse text,
  toelichting_score text,
  suggested_description text,
  optimized_brief text,
  z_indicatoren jsonb,
  v_indicatoren jsonb,
  signalen_per_gezichtspunt jsonb,
  top_risicos jsonb,
  verbeterpunten jsonb,
  beslisregels_toegepast jsonb,
  kritieke_ontbrekende_info jsonb,
  risicotermen jsonb,
  vervolgvragen jsonb,
  suggestions text,
  ai_analysis jsonb,
  analysis_status text,
  overall_risk_label text,
  overall_risk_color text,
  overall_summary text,
  compact_assignment_draft text,
  domains jsonb,
  directional_assessment jsonb,
  top_improvements jsonb,
  additional_improvements jsonb,
  reusable_building_blocks jsonb,
  simulation_hints jsonb,
  follow_up_questions jsonb,
  engagement_duration_module jsonb,
  parent_assessment_id uuid,
  access_source text DEFAULT 'subscription',
  one_time_entitlement_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.dba_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON public.dba_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON public.dba_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments"
  ON public.dba_assessments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage assessments"
  ON public.dba_assessments FOR ALL
  USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- 9. one_time_purchases
-- --------------------------------------------------------
CREATE TABLE public.one_time_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type text NOT NULL DEFAULT 'one_time_dba',
  status text NOT NULL DEFAULT 'purchased',
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  root_assessment_id uuid,
  finalized_at timestamptz,
  converted_at timestamptz,
  credit_used boolean NOT NULL DEFAULT false,
  credit_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.one_time_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases"
  ON public.one_time_purchases FOR ALL
  USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- Indexes
-- --------------------------------------------------------
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_dba_assessments_user_id ON public.dba_assessments(user_id);
CREATE INDEX idx_dba_assessments_created_at ON public.dba_assessments(created_at DESC);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_news_items_published_at ON public.news_items(published_at DESC);
CREATE INDEX idx_news_items_category ON public.news_items(category);
CREATE INDEX idx_user_news_feedback_user ON public.user_news_feedback(user_id);
CREATE INDEX idx_one_time_purchases_user_id ON public.one_time_purchases(user_id);
CREATE INDEX idx_billing_events_stripe_id ON public.billing_events(stripe_event_id);

-- --------------------------------------------------------
-- updated_at trigger
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
