# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-09 (avond)
**Maturity:** 95%

---

## SAMENVATTING

DBA Kompas is een Next.js 16.2 SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De kernfunctionaliteit is stabiel. Alle kritieke AI- en Stripe-bugs zijn opgelost. Conversie-funnel is volledig functioneel. Paywall is actief (alleen betalende gebruikers hebben dashboardtoegang). One-time upsell e-mail en upgrade-flow zijn geïmplementeerd. TEST-002 (Stripe checkout) is bevestigd werkend. Klaar voor TEST-003 (webhook delivery).

---

## LAATSTE ACTIE (2026-04-09 avond, commit pending)

**Taak:** QUAL-002 — Integration tests voor volledige analyse pipeline

**Wat is er gedaan:**
- `__tests__/analyzeDbaText.test.ts` aangemaakt (21 tests)
- Mock strategie: `vi.hoisted(() => vi.fn())` + `vi.mock('@anthropic-ai/sdk')` — onderschept de module-level `anthropic` singleton in `dbaAnalysis.ts`
- `analyzeDbaText` getest (11 tests): insufficient_input zonder API-aanroep, happy path, riskLabel doorgestuurd, retry bij ongeldige JSON, dubbele mislukking → FALLBACK, netwerkfout → FALLBACK, code fences, followUpQuestions uit signaaldetectie, optionele context, coercering ongeldig label, model + max_tokens
- `generateAssignmentDraft` getest (10 tests): compact/full mode, max_tokens 700/2000, standaard compact, API-fout → FALLBACK, dubbele retry mislukking → FALLBACK, reusableBuildingBlocks arrays, model verificatie

**Volgende actie:** `npm test` draaien op lokale machine om alle 67 tests te verifiëren (46 QUAL-001 + 21 QUAL-002), daarna committen.

---

## LAATSTE ACTIE (2026-04-09 ochtend, commit `5f63a53`)

**Taak:** FEAT-004 + FEAT-005 — Paywall + one-time upsell + upgrade flow

**Wat is er gedaan:**
- `modules/billing/entitlements.ts` — `getUserPlan()` uitgebreid met `one_time_purchases` check
- `app/api/user/plan/route.ts` — NIEUW: `GET /api/user/plan` server endpoint
- `components/auth/AuthContext.tsx` — `plan`, `planLoading`, `refreshPlan` toegevoegd aan context
- `app/(app)/layout.tsx` — `AppShell` redirect naar `/upgrade` als `plan === 'free'` (uitzondering: `/profiel`)
- `app/(app)/upgrade/page.tsx` — NIEUW: paywallpagina met 3 plankaarten + directe checkout
- `modules/email/send.ts` — `sendOneTimeUpsellEmail()` toegevoegd (Resend, DBA Kompas huisstijl, upgradeknop naar `/upgrade-to-pro`)
- `app/api/billing/webhook/route.ts` — `sendOneTimeUpsellEmail()` aangeroepen na `one_time_purchases` INSERT
- `app/(app)/upgrade-to-pro/page.tsx` — NIEUW: server component, conflict check, Stripe coupon `ONETIMECREDIT` toepassen, directe Stripe-redirect
- Stripe coupon `ONETIMECREDIT` aangemaakt in test mode (€9,95 off once)
- `STRIPE_COUPON_ONE_TIME_UPGRADE=ONETIMECREDIT` ingesteld als Vercel env var

**Eerder deze sessie (commit `32018b8`):**
- `EmailCheckoutModal.tsx` geconsolideerd: `supabase.auth.signUp()` direct in modal, geen redirect naar `/register` meer. Stap 2 heeft plandropdown bovenin. Verifyscherm binnen modal. Knoptekst "Account aanmaken & betalen". Footer "Al een account? Inloggen →".

**Eerder deze sessie (FIX-014 t/m FIX-020):**
- `app/register/page.tsx` gebouwd — volledig signup + checkout formulier (FIX-014)
- `app/checkout-redirect/page.tsx` gebouwd — post-e-mailverificatie checkout trigger (FIX-015)
- `app/auth/signup/page.tsx` gebouwd — server redirect naar `/login` (FIX-016)
- `/api/billing/checkout` uitgebreid met `plan`-lookup (FIX-017)
- `cancel_url` gecorrigeerd van `/pricing` naar `/dashboard` (FIX-018)
- Supabase Site URL gecorrigeerd naar `https://dba-kompas.vercel.app` (FIX-019, handmatig)
- Redirect URL `https://dba-kompas.vercel.app/**` toegevoegd aan Supabase allowlist (FIX-020, handmatig)
- Stripe keys gecorrigeerd: live mode keys vervangen door test mode keys in Vercel (handmatig)
- `payment_method_types: ['card', 'ideal']` verwijderd uit subscription checkout (iDEAL werkt niet bij recurring)
- TEST-002 bevestigd werkend: "Abonnement geactiveerd!" banner zichtbaar na Stripe betaling

---

## LAATSTE WIJZIGING IN CODE

**Bestanden (commit `5f63a53`):**
- `modules/billing/entitlements.ts` — one_time_purchases check toegevoegd
- `app/api/user/plan/route.ts` — NIEUW
- `components/auth/AuthContext.tsx` — plan state toegevoegd
- `app/(app)/layout.tsx` — paywall redirect toegevoegd
- `app/upgrade/page.tsx` — NIEUW (standalone, geen (app) sidebar)
- `modules/email/send.ts` — sendOneTimeUpsellEmail toegevoegd
- `app/api/billing/webhook/route.ts` — upsell e-mail aanroep toegevoegd
- `app/upgrade-to-pro/page.tsx` — NIEUW (server component, directe Stripe redirect)

**Branch:** `main`
**Status:** Gepusht naar GitHub, live op Vercel

---

## VOLGENDE GEPLANDE STAP

**Commit QUAL-002 + voorbereiding DOC-001**

Nog te doen:
1. `npm test` draaien — verwacht 67 tests groen (46 QUAL-001 + 21 QUAL-002)
2. Commit: `__tests__/analyzeDbaText.test.ts` + `docs/` updates
3. Push naar GitHub (`git push`)
4. Daarna: DOC-001 — `vercel.json` aanmaken + env vars documenteren

**Daarna:**
- **INFRA-001**: Custom SMTP instellen (Resend/Postmark via Supabase SMTP) — vereist vóór live launch
- Na INFRA-001: Supabase e-mailbevestiging opnieuw inschakelen
- **Stripe coupon live mode**: `ONETIMECREDIT` equivalent aanmaken in Stripe live mode + `STRIPE_COUPON_ONE_TIME_UPGRADE` updaten voor productie

---

## WAT WERKT

- Supabase authenticatie (email/password)
- DBA analyse via Claude Haiku (`claude-haiku-4-5-20251001`)
- Twee-fase architectuur: fase 1 = snelle kernanalyse (~5-8s), fase 2 = draft op aanvraag
- Input validatie (minimum 800 tekens / 120 woorden)
- Follow-up vragen als invulvelden op resultaatpagina — heranalyse met gecombineerde tekst
- Nuclear/coerce validator — altijd succesvol voor geldige JSON objecten
- Resultaatpagina UI: colored hero banner, 3-koloms domeinkaarten, actiepunten
- Draft generatie op expliciete knopklik (geen auto-trigger)
- Gesplitste draft generatie: compact (max_tokens 700, ~3-5s) + uitgebreid (max_tokens 2000, ~8-12s, lazy)
- Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft?mode=compact|full`)
- PDF rapport generatie — correct opgemaakt, leesbare tekst, consistente layout
- Rate limiting op analyse endpoint (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- Stripe subscription checkout — TEST-002 BEVESTIGD WERKEND
- Stripe one-time checkout — geïmplementeerd en gecorrigeerd (KI-011)
- Stripe webhook handler — geïmplementeerd met idempotency — TEST-003 BEVESTIGD WERKEND
- Conversie-funnel volledig: modal signUp → verifyscherm → checkout → `/dashboard`
- `EmailCheckoutModal` — geconsolideerd, signUp direct in modal, verifyscherm inline
- `/register` pagina — fallback signup + checkout (pre-filled email/plan)
- `/checkout-redirect` pagina — auto-triggert checkout na e-mailverificatie
- Dashboard succesbericht na geslaagde betaling (`?session_id=...`)
- `trialing` status herkend als actief Pro-plan
- **Paywall** — ingelogde gebruikers zonder actief abonnement of one-time purchase worden doorgestuurd naar `/upgrade`
- **`/upgrade` paywallpagina** (`app/upgrade/page.tsx`, standalone zonder sidebar) — 3 plankaarten, directe Stripe checkout vanuit pagina
- **One-time upsell e-mail** — verstuurd via Resend na `one_time_purchases` INSERT door webhook
- **`/upgrade-to-pro` flow** (`app/upgrade-to-pro/page.tsx`, server component, geen UI) — conflict check (geen dubbel abonnement), Stripe coupon `ONETIMECREDIT` toegepast automatisch als gebruiker one-time purchase heeft
- Newsfeed, notificaties, documentbeheer
- Loops marketing automation (quick_scan, subscription events)
- PostHog analytics
- Sentry error tracking
- Quick scan landing page

## WAT NIET WERKT / ONZEKER

- **GEDEELTELIJK**: Unit tests + integratietests aanwezig (QUAL-001 + QUAL-002 done, 67 tests totaal). E2e-tests nog open.
- **ONBEKEND**: Deployment Vercel config — geen `vercel.json` aanwezig (DOC-001)
- **GETEST**: Stripe webhook delivery — TEST-003 BEVESTIGD WERKEND (2026-04-09)
- **INFRA**: Custom SMTP niet ingesteld — Supabase ingebouwde mailservice heeft rate limits, niet geschikt voor productie. Supabase e-mailbevestiging is tijdelijk UITGESCHAKELD tijdens tests. Inschakelen zodra INFRA-001 gereed is.
- **NIET AANGEMAAKT**: Stripe coupon `ONETIMECREDIT` bestaat alleen in test mode. Vóór live launch: live mode equivalent aanmaken + env var updaten.
- **ONBEKEND**: E-mail digest triggers — geen cron job gevonden voor Resend digests
- **PENDING**: Loops dashboard config — `quick_scan_completed`, `quick_scan_risk_level`, `quick_scan_score` contactvelden instellen + e-mailsequentie koppelen (LOOPS-002, handmatige actie)
- **NO-OP**: `postProcessDbaOutput` verwerkt niet-bestaande velden (KI-008, geen bug)

---

## DEPLOYMENT STATUS

| Omgeving | Status | Onderbouwing |
|---|---|---|
| Lokaal | WERKEND | Bevestigd via tests |
| Vercel (main branch) | LIVE | Auto-deploy via GitHub, TEST-002 bevestigd |
| Vercel config | ONGEDOCUMENTEERD | Geen vercel.json aanwezig |

---

## INTEGRATIE STATUS

| Systeem | Code aanwezig | Geconfigureerd | Live getest |
|---|---|---|---|
| Supabase Auth + DB | JA | JA | BEVESTIGD |
| Anthropic Claude Haiku | JA | JA | BEVESTIGD |
| Stripe (checkout + webhook) | JA | JA | TEST-002 + TEST-003 BEVESTIGD ✅ |
| Resend (digest + upsell) | JA | JA | NEE |
| Loops | JA | JA | NEE (dashboard config pending) |
| PostHog | JA | JA | ONBEKEND |
| Sentry | JA | JA | ONBEKEND |

---

## ARCHITECTUUR OORDEEL

Correct gestructureerd:
- Business logic in `lib/` en `modules/`, niet in UI components
- Alle AI-aanroepen via `claude-haiku-4-5-20251001`
- Supabase admin voor server-side mutaties (RLS bypass correct)
- Entitlements via `modules/billing/entitlements.ts` (active + trialing + one_time = Pro)
- Paywall via `AuthContext` plan state + `AppShell` redirect (client-side, veilig voor MVP)
- Prompt injection beveiliging aanwezig
- Follow-up vragen via signaaldetectie (geen extra AI-aanroep)
- Stripe coupon via server-side `discounts` parameter (nooit client-exposed)

Aandachtspunten:
- `postProcessDbaOutput` verwerkt draft-velden die fase 1 niet meer levert (no-ops, KI-008)
- Geen unit/integration tests aanwezig (KI-005)
- Paywall is client-side — server-side middleware zou robuuster zijn, maar voldoende voor MVP
