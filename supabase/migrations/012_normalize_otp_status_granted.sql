-- ============================================================
-- 012 — Normaliseer one_time_purchases.status='granted' → 'purchased'
-- ============================================================
--
-- Achtergrond:
-- De officiële enum voor one_time_purchases.status is gedocumenteerd in
-- 001_initial_schema.sql als: purchased, in_progress, finalized, converted, expired.
-- In latere flows (welcome-link redemption + mijlpaal-1 referral reward) is per
-- ongeluk een ongedocumenteerde status 'granted' gebruikt. Daardoor falen
-- entitlement-checks die filteren op 'purchased' (zoals getUserPlan,
-- getUserQuotaPlan, check-quota, one-time/entitlement, dba/assessments/finalize).
--
-- Effect vóór deze migratie:
--   Een welcome-link user kreeg na redemption status='granted' en werd door
--   het paywall-layout direct naar /upgrade gestuurd, ondanks zijn 1 gratis check.
--
-- Deze migratie maakt de bestaande rijen consistent met de gedocumenteerde enum.
-- De application code (welcome.ts, referral/engine.ts) wordt in dezelfde commit
-- aangepast om voortaan 'purchased' te schrijven.
--
-- Veilig uitvoeren: idempotent (UPDATE op voorwaarde status='granted').
-- Geen rijen met status='granted' → 0 rows updated.
-- ============================================================

UPDATE public.one_time_purchases
   SET status = 'purchased'
 WHERE status = 'granted';

-- Sanity log: verwacht 0 rijen na migratie
-- SELECT count(*) FROM public.one_time_purchases WHERE status = 'granted';
