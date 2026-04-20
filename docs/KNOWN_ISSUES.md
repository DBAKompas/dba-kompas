# KNOWN_ISSUES.md
**Bekende problemen en bugs**
**Laatst bijgewerkt:** 2026-04-20 (sessie 20 — KI-020 toegevoegd)

---

## KRITIEK

### KI-020 — Koopflow te lang: account-first met wachtwoord + e-mailbevestiging voor betaling
**Status:** IN PROGRESS — 2026-04-20
**Bestand:** `components/marketing/EmailCheckoutModal.tsx`, `app/register/page.tsx`, `app/api/billing/checkout/route.ts`, `app/api/billing/webhook/route.ts`
**Symptoom:** Bezoeker die op een Koop-knop klikt wordt gevraagd om e-mail + wachtwoord + herhaal + terms, krijgt vervolgens een bevestigingsmail, moet inloggen, kiest pas dan het pakket en landt bij Stripe. Totaal 5-6 schermen. Gebruiker meldde blokkerende frictie.
**Impact:** Hoge drop-off pre-checkout; direct risico voor launch-conversie.
**Fix:** Nieuwe guest-email checkout: alleen e-mail + terms -> direct naar Stripe. User wordt aangemaakt door webhook na betaling (`lib/auth/provision-user.ts` + `/api/billing/checkout-guest` + `/api/one-time/checkout-guest`). Welkomstmail bevat magic link voor 1-klik login. Zie `DECISIONS.md` entry 2026-04-20 voor volledige rationale. TEST-006 hangt af van afronding.

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
**Status:** OPEN (blokkeert niet)
**Bestand:** `modules/email/send.ts`, `app/api/billing/webhook/route.ts`
**Symptoom:** Welkomstmails zijn geïmplementeerd en Resend Templates zijn aangemaakt, maar de volledige flow (Stripe webhook → `sendPurchaseWelcomeEmail` → Resend template) is alleen te testen na een echte live Stripe betaling.
**Actie:** Testen als onderdeel van STRIPE-LIVE end-to-end test.

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
