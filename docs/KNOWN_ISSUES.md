# KNOWN_ISSUES.md
**Bekende problemen en bugs**
**Laatst bijgewerkt:** 2026-04-21 (sessie 22 eindstand — INFRA-002 triggers live, KI-022 fix via GitHub Actions externe cron gedeployed + Secrets toegevoegd + workflow groen gedraaid, backfill uitgevoerd, wacht op mail-validatie volgende tick)

---

## HOOG

### KI-022 — Admin-rol promotie trigger verstuurt geen mail
**Status:** FIX OPERATIONEEL, WACHT OP MAIL-VALIDATIE — 2026-04-21 (sessie 22 eindstand — GitHub Actions workflow run #1 groen, backfill uitgevoerd, volgende tick moet mail versturen)
**Bestand:** `supabase/migrations/008_admin_alert_triggers.sql`, `lib/admin/alerts.ts`
**Symptoom:** Na handmatige promotie van een testaccount naar `role = 'admin'` verschijnt er correct een rij in `public.admin_alerts` (type `general`, severity `critical`, title "Nieuwe admin-rol toegekend"), maar `email_sent = false` en er komt geen mail aan op `marvinzoetemelk@gmail.com`.
**Oorzaak:** De Postgres-triggers `notify_admin_role_promotion` en `notify_admin_role_insert` doen een directe `INSERT INTO public.admin_alerts (...)`. Daarmee wordt de TypeScript-laag (`lib/admin/alerts.ts :: createAlert()` → `sendAlertEmail()`) volledig omzeild, en er gaat geen Postmark-mail uit. De andere drie triggers (cron, quota-misbruik, analyse-fouten) gaan wel via `createAlert()` en zullen wel mail versturen, maar dat is nog niet gerooktest.

**Impact:** Bij een echte security-event (iemand krijgt ten onrechte de admin-rol via direct SQL of seed) zit de melding in de database, maar Marvin ontvangt geen directe mail. Moet actief in Control Tower gekeken worden om de alert op te merken.

**Mogelijke oplossingen (keuze in volgende sessie):**
1. **Eenvoudigst — app-route-wrapper**: nieuwe `/api/admin/promote` endpoint dat zowel `profiles.role` update als `createAlert()` aanroept. Trigger blijft als fallback voor directe DB-wijzigingen, maar zonder mail.
2. **Periodic worker**: nieuwe cron `pending-alerts` (elke 5 min) die `admin_alerts` rows selecteert waar `email_sent = false` en severity = `critical` en `created_at > now() - interval '1 hour'`, en per rij `sendAlertEmail` aanroept + `email_sent = true` zet.
3. **Supabase Edge Function + Database Webhook**: trigger op INSERT naar `admin_alerts` stuurt HTTP POST naar `/api/admin/alerts/mail-pending/:id`.
4. **pg_net extension**: trigger gebruikt `net.http_post()` om een Next.js-endpoint aan te roepen. Vereist extension en secret-management.

**Aanbevolen:** optie 2 (periodic worker). Robuust, werkt ook voor toekomstige alert-bronnen die buiten de app-laag draaien (DB-trigger, andere services). Backfill mogelijk voor historische rijen met `email_sent = false`.

**Fix (geïmplementeerd sessie 22):**
- Nieuwe route `app/api/cron/pending-alerts/route.ts`.
- Criteria: `email_sent = false AND resolved = false AND severity = 'critical' AND created_at > now() - 1 hour`, cap 10 per run, oplopende `created_at`-volgorde.
- Idempotent: na succesvolle `sendAlertEmail()` wordt `email_sent = true` gezet.
- Outer catch roept geen `createAlert` aan om loops te voorkomen.
- CRON_SECRET Bearer auth (bestaand patroon).

**Cron-trigger (aangepast sessie 22):** eerst geprobeerd via Vercel cron `*/5 * * * *`, maar Vercel Hobby plan blokkeerde de deploy (max 2-3 grandfathered crons, minimum 1x/dag). Nu via GitHub Actions: `.github/workflows/pending-alerts.yml` runt elke 10 minuten (plus handmatig trigger mogelijk via workflow_dispatch) en curlt naar `/api/cron/pending-alerts`. Vereist 2 GitHub Secrets: `PRODUCTION_URL` = `https://dbakompas.nl` en `CRON_SECRET` (zelfde waarde als Vercel env).

**Status sessie 22 eindstand:**
1. GitHub Secrets toegevoegd: `PRODUCTION_URL = https://dbakompas.nl` + `CRON_SECRET` (zelfde waarde als Vercel env).
2. Handmatige workflow-run #1 gedraaid: HTTP 200, response `{"processed":0,"mailed":0,"mailFailed":0,"durationMs":909}`. Endpoint + auth zijn dus operationeel.
3. Backfill uitgevoerd op oude rooktest-alert van 09:43:30: rij id `647a2a4b-c6a9-4153-9398-e0d5570c6a70` heeft nu `created_at = 2026-04-21 12:35:29` (valt binnen het 1-uur venster).
4. Eerstvolgende cron-tick (elke 10 min, plus handmatig via `workflow_dispatch`) moet deze rij oppakken, mail versturen en `email_sent = true` zetten.

**Validatie volgende sessie:**
1. Check mailbox `marvinzoetemelk@gmail.com` op mail met subject "Nieuwe admin-rol toegekend".
2. Verifieer in Supabase:
   ```sql
   SELECT id, title, email_sent, email_sent_at, created_at
   FROM public.admin_alerts
   WHERE id = '647a2a4b-c6a9-4153-9398-e0d5570c6a70';
   ```
   `email_sent` moet `true` zijn en `email_sent_at` gevuld.
3. Als succesvol: doe een tweede rooktest met fresh role-wissel om end-to-end pad te valideren.
4. Daarna KI-022 → OPGELOST zetten in dit bestand en `docs/TASKS.md` regel afvinken.

**Als er niks gebeurt:**
- Check GitHub Actions tab → laatste "Pending alerts mail-worker" run → logs inspecteren.
- Check Vercel function logs voor `/api/cron/pending-alerts`.
- Verifieer dat de rij daadwerkelijk binnen 1 uur van `now()` valt en `severity = 'critical'` heeft.

---

---

## KRITIEK

### KI-021 — "Onbeperkt analyses"-belofte: AI-kostenrisico bij misbruik of accountdelen
**Status:** OPGELOST — 2026-04-21 (migratie 007 uitgevoerd, Vercel-deploy groen, Postmark-templates bijgewerkt, UsageMeter live op dashboard. Stripe product-description check door Marvin akkoord.)
**Bestanden:**
- Nieuw: `supabase/migrations/007_usage_counters.sql`, `modules/usage/quota-config.ts`, `modules/usage/check-quota.ts`, `app/api/usage/route.ts`, `components/dashboard/UsageMeter.tsx`
- Aangepast: `modules/billing/entitlements.ts` (nieuwe `getUserQuotaPlan`), `app/api/dba/analyse/route.ts` (reserveUsage + releaseUsage), `app/(app)/dashboard/page.tsx` (UsageMeter + success-tekst), `app/upgrade/page.tsx`, `content/landing.nl.ts`, `components/marketing/QuickScan.tsx`, `components/marketing/EmailCheckoutModal.tsx`, `email-templates/welkomstmail-*.html|.txt`, `scripts/create-resend-templates.ts`, `email-preview.html`, `docs/MASTERPLAN_SAAS_PROFESSIONAL.md`
**Symptoom:** De oude plan-omschrijvingen beloofden "onbeperkt analyses" bij maand en jaar. Een Claude Haiku 4.5 analyse kost ~€0,004 per call bij gemiddelde input; een bot of gedeeld account kan in één nacht honderden euro's aan AI-kosten genereren.
**Impact:** Direct financieel risico op launch — geen cap op API-kosten per gebruiker.
**Fix (doorgevoerd):**
- Harde quota: monthly 20/mnd, yearly 25/mnd, one_time 1 totaal (lifetime via `dba_assessments` count), free 0.
- Reset op de 1e van de kalendermaand via `currentPeriodStart()` in `quota-config.ts`.
- Race-safe increment: Postgres RPC `increment_usage_if_under_quota` met `INSERT ... ON CONFLICT DO NOTHING` + conditional `UPDATE ... WHERE checks_used < p_quota_limit`. Alleen exact N requests slagen. SECURITY DEFINER, alleen service_role mag executeren.
- Compensating transaction bij AI-fouten: `release_usage_reservation` decrementeert de counter als de analyse faalt vóór opslag.
- UsageMeter component op dashboard toont "X / Y" met voortgangsbalk (groen/oranje bij 80%, rood bij limiet).
- Success-banner na checkout is aangepast: van "onbeperkt" naar "u ziet rechts hoeveel analyses u deze maand nog kunt uitvoeren".
- Upgrade-pagina, landing-content, quickscan modal-tiles, email-checkout modal en welkomstmails (HTML + TXT) tonen nu "Tot 20 DBA-checks per maand" en "Tot 25 DBA-checks per maand".
**Restactie:** geen. Afgerond.

**Verificatie:**
- Migration 007 uitgevoerd: `pg_proc` toont `increment_usage_if_under_quota` en `release_usage_reservation` met `prosecdef = true`; `SELECT count(*) FROM public.usage_counters` returnt 0 (tabel aangemaakt, leeg).
- Vercel-deploy groen na push.
- Postmark-templates voor `welkomstmail-eenmalig | -maand | -jaar` bijgewerkt.
- Stripe product-description: geen omschrijving ingevuld bij price of product, dus niks te wijzigen (geen "onbeperkt" zichtbaar voor klant).
- UsageMeter visueel akkoord door Marvin op dashboard.

**Restrisico (geaccepteerd):** one_time plan is count-based op `dba_assessments` en daardoor niet beschermd door atomic RPC. Exact gelijktijdige parallelle requests kunnen in theorie beide doorgaan (max 1 extra AI-call à circa 0,004 euro). Acceptabel voor launch; herevalueer pas bij bewezen misbruikpatroon.

---

### KI-020 — Koopflow te lang: account-first met wachtwoord + e-mailbevestiging voor betaling
**Status:** PENDING TEST — 2026-04-20 (code live op main, wacht op Postmark-templates en TEST-006 retest)
**Bestand:** `components/marketing/EmailCheckoutModal.tsx`, `app/register/page.tsx`, `app/api/billing/checkout-guest/route.ts`, `app/api/one-time/checkout-guest/route.ts`, `app/api/billing/webhook/route.ts`, `lib/auth/provision-user.ts`
**Symptoom:** Bezoeker die op een Koop-knop klikt wordt gevraagd om e-mail + wachtwoord + herhaal + terms, krijgt vervolgens een bevestigingsmail, moet inloggen, kiest pas dan het pakket en landt bij Stripe. Totaal 5-6 schermen. Gebruiker meldde blokkerende frictie.
**Impact:** Hoge drop-off pre-checkout; direct risico voor launch-conversie.
**Fix (doorgevoerd):** Guest-email checkout live op `main` (commits `fdc455b` + `48dfb43` + `3b282b7`). Nieuwe endpoints `/api/billing/checkout-guest` + `/api/one-time/checkout-guest` creëren geen user; webhook roept `provisionUserForCheckout` aan bij ontbrekende `metadata.user_id` (idempotent via `billing_events`). Welkomstmail bevat nu click-through activate-link én magic-link fallback (zie KI-020-A). Volledige rationale in `DECISIONS.md` entry 2026-04-20.
**Restactie:** Postmark-templates bijwerken + TEST-006 B1/B2/B3 live retest.

---

### KI-020-A — Gmail SafeBrowsing prefetcht rauwe Supabase magic-links vóór klant
**Status:** PENDING TEST — 2026-04-20 (code live op main, wacht op Postmark-templates en TEST-006 retest)
**Bestand:** `lib/auth/welcome-token.ts`, `lib/auth/welcome-token-server.ts`, `app/auth/activate/[token]/*`, `app/auth/welcome/[token]/*`, `modules/email/send.ts`, `app/login/page.tsx`, `supabase/migrations/006_welcome_tokens.sql`
**Symptoom:** Bij TEST-006 werd de magic-link in de welkomstmail door Gmail's SafeBrowsing-scanner geprefetcht vóór de klant kon klikken. Het single-use Supabase-token raakte daardoor verbruikt; de klant zag vervolgens `otp_expired` en belandde op `/login`.
**Impact:** Kritiek: elke Gmail-ontvanger kan niet inloggen via de welkomstmail. Breekt de guest-checkout-belofte van "1-klik naar dashboard".
**Fix (doorgevoerd, amendement op KI-020):**
- Eigen click-through pagina's op dbakompas.nl: `/auth/activate/<token>` (primair, wachtwoord-instel) en `/auth/welcome/<token>` (magic-link fallback).
- Pagina's zijn POST-only voor token-verbruik (Gmail prefetcht geen POSTs); GET toont alleen de UI.
- Stateful tokens in `public.welcome_tokens` (HMAC-signed, 24u TTL, RLS aan, service-role-only). Revocation automatisch bij used.
- `/login`-pagina detecteert `auth_callback_error` / `otp_expired` en schakelt direct naar magic-mode met banner.
- Build-fix (commit `e77f9e7`): Next.js 16 / React 19 staat in `'use server'`-bestanden alleen async-exports toe. `ActivateActionState` verplaatst naar `types.ts`, `PASSWORD_MIN_LENGTH` intern.
**Restactie:** Postmark-templates `welkomstmail-eenmalig | -maand | -jaar` handmatig aanpassen: primaire CTA-knop naar `{{ activate_link }}`, secundaire tekst-link naar `{{ login_link }}`, DBA-huisstijl (logo, #0F1A2E, #F5A14C). Daarna TEST-006 B1/B2/B3 retest inclusief 1 magic-link-test.

---

### KI-001 — Fase 1 prompt te zwaar (TRUNCATION RISICO)
**Status:** OPGELOST — 2026-04-07
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `buildDbaFastAnalysisPrompt`
**Symptoom:** Analyse geeft `FALLBACK_DBA_ENGINE_OUTPUT` terug ("Analyse kon niet worden voltooid")
**Fix:** Zware velden (`simulationFactState`, `simulationHints`, `followUpQuestions`, `additionalImprovements`) verwijderd uit fase 1 output schema.

---

### KI-002 — JSON.parse zonder try/catch in retryWithAnthropicFix
**Status:** OPGELOST — 2026-04-07
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `retryWithAnthropicFix`
**Fix:** try/catch toegevoegd rondom `JSON.parse(cleanContent)`.

---

### KI-010 — `buildFollowUpQuestions` niet geïmporteerd in dbaAnalysis.ts
**Status:** OPGELOST — 2026-04-08 (commit `92ea711`)
**Bestand:** `lib/ai/dbaAnalysis.ts`
**Symptoom:** Elke analyse gaf "Internal server error" — functie werd aangeroepen maar niet geïmporteerd.
**Fix:** `buildFollowUpQuestions` toegevoegd aan import vanuit `./inputValidation`.

---

### KI-011 — STRIPE_ONE_TIME_DBA_PRICE_ID mismatch
**Status:** OPGELOST — 2026-04-08 (commit `ae44683`)
**Bestand:** `app/api/one-time/checkout/route.ts`
**Symptoom:** One-time checkout gaf altijd HTTP 500 ("One-time purchase not configured") omdat `process.env.STRIPE_ONE_TIME_DBA_PRICE_ID` altijd `undefined` was.
**Oorzaak:** Code gebruikte `STRIPE_ONE_TIME_DBA_PRICE_ID`, maar `.env.local` en Vercel env vars gebruiken `STRIPE_PRICE_ID_ONE_TIME`.
**Fix:** `STRIPE_ONE_TIME_DBA_PRICE_ID` → `STRIPE_PRICE_ID_ONE_TIME` in route.ts.

---

## HOOG

### KI-003 — Debug endpoint publiek toegankelijk
**Status:** OPGELOST — 2026-04-07 (bestand verwijderd)
**Bestand:** `app/api/debug/ai-test/route.ts`
**Fix:** Bestand verwijderd.

---

### KI-004 — Geen rate limiting op analyse endpoint
**Status:** OPGELOST — 2026-04-07 (free: 20/dag, pro: 100/dag)
**Bestand:** `app/api/dba/analyse/route.ts`
**Fix:** Supabase-gebaseerde count-check toegevoegd.

---

### KI-007 — Stripe webhook niet live getest
**Status:** OPGELOST — 2026-04-09
**Wat gedaan:** Stripe Dashboard webhook `dba-kompas-vercel-test` aangemaakt, `STRIPE_WEBHOOK_SECRET` in Vercel gezet, echte checkout uitgevoerd. Alle drie DB-tabellen correct bijgewerkt: `billing_events` (checkout.session.completed + invoice.paid), `subscriptions` (status=active), `profiles` (gebruiker aanwezig).

---

### KI-017 — Geen paywall: ingelogde gebruikers zonder betaling hebben dashboard-toegang
**Status:** OPGELOST — 2026-04-09 (commit `5f63a53`)
**Bestand:** `app/(app)/layout.tsx`, `modules/billing/entitlements.ts`
**Symptoom:** Elke geauthenticeerde gebruiker kan `/dashboard`, `/analyse`, `/nieuws` etc. bereiken ongeacht of ze betaald hebben. `getUserPlan()` checkt niet op `one_time_purchases`. `AppShell` checkt alleen `if (!user)`.
**Fix:** Zie FEAT-004 plan in TASKS.md
**Risico:** Gebruikers kunnen gratis analyses uitvoeren zonder actief abonnement of aankoop.

---

## MIDDEL

### KI-005 — Geen tests aanwezig
**Status:** OPGELOST — 2026-04-09 (QUAL-001 + QUAL-002)
**Fix:** 67 tests toegevoegd in drie bestanden:
- `__tests__/validateDbaInput.test.ts` — 23 tests (countWords, detectSignals, validateDbaInput, buildFollowUpQuestions)
- `__tests__/validateDbaEngineOutput.test.ts` — 23 tests (nuclear coercion validators)
- `__tests__/analyzeDbaText.test.ts` — 21 integratietests (analyzeDbaText + generateAssignmentDraft, Anthropic gemockt)

---

### KI-006 — Alle functies gebruikten claude-opus-4-6
**Status:** OPGELOST — 2026-04-07 (commit `a976d4c`)
**Fix:** Alle aanroepen gewijzigd naar `claude-haiku-4-5-20251001`.

---

### KI-012 — `trialing` status niet als Pro herkend in getUserPlan()
**Status:** OPGELOST — 2026-04-08 (commit `ae44683`)
**Bestand:** `modules/billing/entitlements.ts`
**Symptoom:** Gebruikers in een Stripe trial werden als 'free' behandeld.
**Fix:** `subscription.status !== 'active'` uitgebreid naar `status !== 'active' && status !== 'trialing'`.

---

## LAAG

### KI-008 — `postProcessDbaOutput` verwerkt niet-bestaande velden
**Status:** OPGELOST — 2026-04-09
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `postProcessDbaOutput`
**Fix:** Verduidelijkende comment toegevoegd boven de functie. Guards (long/compact/blocks) zijn bewust behouden voor eventueel toekomstig hergebruik vanuit fase 2.

---

### KI-009 — Deployment configuratie ontbreekt
**Status:** OPGELOST — 2026-04-09 (DOC-001)
**Fix:** `vercel.json` aangemaakt (regio `fra1`, www-redirect), `docs/DEPLOYMENT.md` aangemaakt met alle env vars en productielaunch checklist.

---

### KI-014 — `/register`, `/auth/signup`, `/checkout-redirect` bestonden niet
**Status:** OPGELOST — 2026-04-09
**Bestanden:** `app/register/page.tsx`, `app/auth/signup/page.tsx`, `app/checkout-redirect/page.tsx` (NIEUW)
**Symptoom:** `EmailCheckoutModal` redirect naar `/register?email=...&plan=...` gaf 404. QuickScan "Ga verder" knop (`/auth/signup`) gaf 404. Volledige conversie-funnel was gebroken.
**Fix:**
- `app/register/page.tsx`: volledig signup+checkout formulier, pre-filled email/plan, Supabase signUp, directe checkout bij geen e-mailverificatie, emailRedirectTo naar `/checkout-redirect` bij verificatie vereist
- `app/checkout-redirect/page.tsx`: auto-triggert checkout API na emailverificatie (`/auth/callback?next=/checkout-redirect?plan=...`)
- `app/auth/signup/page.tsx`: server-side redirect naar `/login`

---

### KI-015 — `cancel_url` in checkout routes wees naar `/pricing` (404)
**Status:** OPGELOST — 2026-04-09
**Bestanden:** `app/api/billing/checkout/route.ts`, `app/api/one-time/checkout/route.ts`
**Symptoom:** Na annuleren van Stripe checkout landde gebruiker op 404 (`/pricing` bestaat niet als route).
**Fix:** `cancel_url` gewijzigd naar `/dashboard` in beide checkout routes.

---

### KI-016 — Checkout API accepteerde alleen `priceId`, niet `plan`
**Status:** OPGELOST — 2026-04-09
**Bestand:** `app/api/billing/checkout/route.ts`
**Symptoom:** Client moest Stripe price IDs kennen om checkout te starten — niet beveiligd.
**Fix:** `plan: 'monthly' | 'yearly'` toegevoegd als alternatief voor `priceId`. Server zoekt priceId op via env vars (`STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`). Backwards compatible — `priceId` werkt nog steeds.

---

### KI-019 — Welkomstmails nog niet live getest na Stripe live betaling
**Status:** PENDING TEST — 2026-04-20 (samengevoegd met TEST-006 retest voor KI-020-A)
**Bestand:** `modules/email/send.ts`, `app/api/billing/webhook/route.ts`
**Symptoom:** Welkomstmails zijn geïmplementeerd en Postmark-templates zijn aangemaakt, maar de volledige flow (Stripe webhook → `sendPurchaseWelcomeEmail` → Postmark template → activate-/login-link) is pas volledig getest na een echte live Stripe betaling voor elk van de drie productvarianten.
**Actie:** Wordt afgevinkt als onderdeel van TEST-006 B1/B2/B3 retest (zie `docs/TEST_006_RESULTS.md`).

---

### KI-013 — Loops deduplicatie is in-memory
**Status:** OPEN (low priority)
**Bestand:** `lib/loops/index.ts`
**Symptoom:** De `Map`-based deduplicatie reset bij elke server-herstart. Bij hoge load of serverless cold starts kunnen dubbele Loops events worden gestuurd.
**Actie:** Acceptabel voor huidige schaal. Bij problemen: Redis of Supabase-gebaseerde deduplicatie.

---

### KI-018 — Digest e-mails hebben geen trigger
**Status:** OPGELOST — 2026-04-11 (LOOPS-003, commit `c853b45`)
**Bestanden:** `app/api/cron/weekly-digest/route.ts` (NIEUW), `app/api/cron/monthly-digest/route.ts` (NIEUW), `vercel.json` (uitgebreid)
**Oplossing:** Vercel Cron Jobs aangemaakt:
- `GET /api/cron/weekly-digest` — elke maandag 07:00 UTC, beveiligd via `CRON_SECRET`
- `GET /api/cron/monthly-digest` — elke 1e van de maand 07:00 UTC, beveiligd via `CRON_SECRET`
- `vercel.json` uitgebreid met `crons` sectie
- `CRON_SECRET` env var gedocumenteerd in `.env.local.example` + `docs/DEPLOYMENT.md`
