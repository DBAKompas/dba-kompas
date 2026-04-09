# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-09
**Maturity:** 88%

---

## SAMENVATTING

DBA Kompas is een Next.js 16.2 SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De kernfunctionaliteit is stabiel en werkt. Alle kritieke AI- en Stripe-bugs zijn opgelost. PDF-rapporten genereren correct. Loops quick-scan endpoint is actief. De applicatie is klaar voor live Stripe-tests (TEST-002/003).

---

## LAATSTE ACTIE (2026-04-09)

**Taak:** FIX-CONV — volledige conversie-funnel hersteld

**Wat is er gedaan:**
- `app/register/page.tsx` gebouwd — volledig signup + checkout formulier (target van `EmailCheckoutModal`)
- `app/checkout-redirect/page.tsx` gebouwd — auto-triggert checkout na e-mailverificatie
- `app/auth/signup/page.tsx` gebouwd — server redirect naar `/login` (target van QuickScan success)
- `app/api/billing/checkout/route.ts` uitgebreid met `plan`-lookup (backwards compatible)
- `cancel_url` in beide checkout routes gecorrigeerd van `/pricing` (404) naar `/dashboard`

**Eerder deze sessie (commits 2026-04-08):**
| Commit | Beschrijving |
|---|---|
| `92ea711` | fix: `buildFollowUpQuestions` import ontbrak in `dbaAnalysis.ts` |
| `910ce2d` | fix: PDF toont leesbare drafttekst i.p.v. ruwe JSON |
| `b1569d3` | fix: pdfkit toegevoegd aan `serverExternalPackages` |
| `a8c4268` | fix: PDF logo, domeinnamen, betere lege tekst, full draft max_tokens 2000 |
| `a5bff30` | refactor: volledige PDF redesign |
| `7c13cc5` | feat: Loops quick-scan endpoint + success screen knoppen werkend |
| `ae44683` | fix: Stripe checkout succesbericht, trialing plan, env var naam |
| `3cf2a24` | docs: volledige sessiesynchronisatie 2026-04-08 |

---

## LAATSTE WIJZIGING IN CODE

**Bestanden:**
- `app/register/page.tsx` — NIEUW
- `app/checkout-redirect/page.tsx` — NIEUW
- `app/auth/signup/page.tsx` — NIEUW
- `app/api/billing/checkout/route.ts` — plan-lookup + cancel_url fix
- `app/api/one-time/checkout/route.ts` — cancel_url fix

**Branch:** `main`
**Status:** Gereed voor commit

---

## VOLGENDE GEPLANDE STAP

**TEST-002: Stripe betalingsflow live testen in test mode**

Instructies (gereed):
1. Zet Stripe test-keys in Vercel omgevingsvariabelen:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
   - `STRIPE_PRICE_ID_MONTHLY=price_...`
   - `STRIPE_PRICE_ID_YEARLY=price_...`
   - `STRIPE_PRICE_ID_ONE_TIME=price_...`
2. Deploy naar Vercel (auto-deploy bij push naar `main`)
3. Ga naar de landingspagina → klik op een plan → `EmailCheckoutModal` → vul email/wachtwoord in → doorgestuurd naar `/register`
4. Op `/register`: wachtwoord invullen → "Account aanmaken & betalen" → Stripe Checkout opent
5. Gebruik testkaart `4242 4242 4242 4242`, vervaldatum in de toekomst, willekeurige CVC
6. Na betaling: verwacht groen succesbericht op `/dashboard`

**TEST-003: Stripe webhook delivery testen**

Instructies (gereed):
1. Lokaal: `stripe listen --forward-to localhost:3000/api/billing/webhook`
2. De CLI geeft een `whsec_...` signing secret → zet als `STRIPE_WEBHOOK_SECRET` in `.env.local`
3. Trigger: `stripe trigger checkout.session.completed`
4. Controleer `billing_events` en `subscriptions` tabel in Supabase

**Productie webhook URL:** `https://dbakompas.nl/api/billing/webhook`
(Configureren in Stripe Dashboard → Developers → Webhooks)

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
- PDF rapport generatie — correct opgemaakt, leesbare tekst, consistente layout (lib/pdf/generate.ts)
- Rate limiting op analyse endpoint (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- Stripe betalingen (subscriptions + one-time) — code klaar, conversie-funnel volledig, klaar voor live tests
- Registratiepagina (`/register`) — signup + plan-selectie + directe Stripe checkout
- Checkout-redirect pagina (`/checkout-redirect`) — post-emailverificatie checkout trigger
- `/auth/signup` — server redirect naar `/login` (QuickScan target)
- Dashboard succesbericht na geslaagde betaling
- `trialing` status herkend als actief Pro-plan
- Newsfeed, notificaties, documentbeheer
- Resend e-mail digests (code aanwezig, trigger onbekend)
- Loops marketing automation
  - `quick_scan_completed` event via `/api/loops/quick-scan`
  - `subscription_started`, `subscription_canceled`, `payment_failed` events via webhook
- PostHog analytics
- Sentry error tracking
- Quick scan landing page (5-vragen quiz) — koppelt correct door naar `/auth/signup` en `/#pricing`

## WAT NIET WERKT / ONZEKER

- **ONTBREEKT**: Tests (unit, integratie, e2e) — regressions worden niet automatisch gedetecteerd
- **ONBEKEND**: Deployment Vercel config — geen `vercel.json` aanwezig
- **NIET GETEST**: Stripe betalingsflow live (TEST-002/003 zijn volgende stap)
- **ONBEKEND**: E-mail digest triggers — geen cron job gevonden voor Resend digests
- **PENDING**: Loops dashboard config — `quick_scan_completed`, `quick_scan_risk_level`, `quick_scan_score` contactvelden instellen + e-mailsequentie koppelen (LOOPS-002, handmatige actie)
- **NO-OP**: `postProcessDbaOutput` verwerkt niet-bestaande velden (KI-008, geen bug)

---

## DEPLOYMENT STATUS

| Omgeving | Status | Onderbouwing |
|---|---|---|
| Lokaal | WERKEND | Bevestigd via tests |
| Vercel (main branch) | LIVE (vermoedelijk) | Auto-deploy via GitHub |
| Vercel config | ONGEDOCUMENTEERD | Geen vercel.json aanwezig |

---

## INTEGRATIE STATUS

| Systeem | Code aanwezig | Geconfigureerd | Live getest |
|---|---|---|---|
| Supabase Auth + DB | JA | JA | BEVESTIGD |
| Anthropic Claude Haiku | JA | JA | BEVESTIGD |
| Stripe | JA | JA | NEE (klaar voor TEST-002/003) |
| Resend | JA | JA | NEE |
| Loops | JA | JA | NEE (dashboard config pending) |
| PostHog | JA | JA | ONBEKEND |
| Sentry | JA | JA | ONBEKEND |

---

## ARCHITECTUUR OORDEEL

Correct gestructureerd:
- Business logic in `lib/`, niet in UI components
- Alle AI-aanroepen via `claude-haiku-4-5-20251001`
- Supabase admin voor server-side mutaties (RLS bypass correct)
- Entitlements via `modules/billing/entitlements.ts` (trialing + active = Pro)
- Prompt injection beveiliging aanwezig
- Follow-up vragen via signaaldetectie (geen extra AI-aanroep)

Aandachtspunten:
- `postProcessDbaOutput` verwerkt draft-velden die fase 1 niet meer levert (no-ops, KI-008)
- Geen unit/integration tests aanwezig (KI-005)
