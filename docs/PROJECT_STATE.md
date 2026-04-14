# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-13 (sessie 7)
**Maturity:** 99%

---

## SAMENVATTING

DBA Kompas is een Next.js SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De kernfunctionaliteit is stabiel en live op `dbakompas.nl`. INFRA-001 is volledig afgerond. Welkomstmails zijn gebouwd voor alle drie aankoopsoorten. Resend Templates aangemaakt en gekoppeld. Stripe staat nog in test mode. Volgende blok: STRIPE-LIVE.

---

## EERSTE TAAK VOLGENDE SESSIE — STRIPE-LIVE

1. Stripe live keys instellen in Vercel: `STRIPE_SECRET_KEY` (sk_live_...), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
2. Live webhook aanmaken in Stripe Dashboard: `https://dbakompas.nl/api/billing/webhook` (5 events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed)
3. Nieuw `STRIPE_WEBHOOK_SECRET` uit live webhook kopiëren naar Vercel
4. Live price IDs instellen: `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, `STRIPE_PRICE_ID_ONE_TIME`
5. Coupon `ONETIMECREDIT` aanmaken in Stripe live mode Dashboard
6. `STRIPE_COUPON_ONE_TIME_UPGRADE` updaten naar live mode coupon ID in Vercel
7. End-to-end live betaling testen (echte kaart, kleine bedragen indien mogelijk)

---

## LAATSTE ACTIE (2026-04-13 sessie 7 — INFRA-001 afgerond + welkomstmails + Resend Templates)

### INFRA-001 VOLLEDIG AFGEROND ✅

- Supabase verificatiemail: logo bijgewerkt naar v3 full horizontal (`logo-white-v3-full.png`) ✅
- Go html/template parse error opgelost: `<img>` tag op één regel gezet ✅
- `NEXT_PUBLIC_APP_URL` bijgewerkt naar `https://dbakompas.nl` in Vercel ✅
- `RESEND_API_KEY` toegevoegd aan Vercel env vars ✅
- Redeploy doorgevoerd, verificatiemail werkend van `noreply@dbakompas.nl` ✅
- `public/logo-white-v3-full.png` toegevoegd aan repository ✅

### Nederlandstalige foutmeldingen geïmplementeerd

- `lib/auth-errors.ts` aangemaakt — centrale `translateAuthError(message)` functie
- Alle Supabase Engelse foutmeldingen worden vertaald naar Nederlands
- Gebruikt in `components/marketing/EmailCheckoutModal.tsx` en `app/register/page.tsx`

### Welkomstmails gebouwd (alle drie aankoopsoorten)

- `modules/email/send.ts` volledig herschreven:
  - `PurchasePlan = 'one_time' | 'monthly' | 'yearly'` type toegevoegd
  - `buildPurchaseWelcomeHtml(plan)` — DBA Kompas huisstijl HTML per plan (full-width, no "onbeperkt")
  - `sendPurchaseWelcomeEmail(to, plan)` — gebruikt Resend template ID via env var, valt terug op inline HTML
- `app/api/billing/webhook/route.ts` uitgebreid — `sendPurchaseWelcomeEmail()` aangeroepen bij:
  - `mode=payment` (one_time): na `one_time_purchases` INSERT
  - `mode=subscription`: in `Promise.all` bij subscription activatie

### Resend Templates aangemaakt en gekoppeld

- Template 1 (eenmalige check): `103d7be2-e2a6-48e6-9c29-5db48de2b338`
- Template 2 (maandabonnement): `11387950-bdd2-4e81-bf5c-fde9f60d1baa`
- Template 3 (jaarabonnement): `02824f32-0da5-407c-b44e-3b89c0ea2d52`
- Template IDs toegevoegd aan `.env.local.example`
- Template IDs als env vars in Vercel ingesteld + redeploy doorgevoerd

### Email copy en breedte gecorrigeerd

- Outer div: `width: 100%` — donkere achtergrond vult volle emailbreedte (was `max-width: 580px`)
- `min-height: 100vh` verwijderd (niet geschikt voor e-mail)
- Tekst: geen "onbeperkt", geen WTTA-referentie, open professionele toon
- Subjects: "DBA Kompas — Je check staat klaar", "— Je maandabonnement is actief", "— Je jaarabonnement is actief"

### Backlog uitgebreid

- `BILLING-002` toegevoegd aan TASKS.md: analyse-limieten + credit top-up (briefing-eerst aanpak)
- `AUTH-002` toegevoegd aan TASKS.md: 2FA banner in dashboard (aanbevolen, niet verplicht)

---

## VORIGE ACTIE (2026-04-12 sessie 6 — Documentatiesync, geen codewijzigingen)

Sessie 6 is uitsluitend gebruikt voor documentatiesync. Er zijn geen codewijzigingen of configuratiewijzigingen doorgevoerd.

---

## VORIGE ACTIE (2026-04-12 sessie 5 — INFRA-001 DNS migratie afgerond + Supabase template)

- Cloudflare actief ✅, NS-records correct ✅
- Resend domein `dbakompas.nl` geverifieerd ✅
- Loops sending domain gewijzigd naar `dbakompas.nl`, alle 5 DNS-records geverifieerd ✅
- Supabase SMTP geconfigureerd via Resend (`smtp.resend.com`, port 465, user `resend`) ✅
- Supabase Site URL + Redirect URL bijgewerkt naar `dbakompas.nl` ✅
- Supabase e-mailbevestiging ingeschakeld ✅
- Supabase Confirm signup template: DBA Kompas donker navy huisstijl ✅
- Vercel custom domain `dbakompas.nl`: gekoppeld, SSL actief ✅
- SPF-record gecombineerd voor Resend + STRATO ✅

---

## LAATSTE WIJZIGING IN CODE

**Bestanden gewijzigd in sessie 7:**

| Bestand | Type | Omschrijving |
|---|---|---|
| `lib/auth-errors.ts` | NIEUW | `translateAuthError()` — Supabase errors → Nederlands |
| `components/marketing/EmailCheckoutModal.tsx` | GEWIJZIGD | `translateAuthError` gebruikt bij foutafhandeling |
| `app/register/page.tsx` | GEWIJZIGD | `translateAuthError` gebruikt bij foutafhandeling |
| `public/logo-white-v3-full.png` | NIEUW | v3 full horizontal wit DBA Kompas logo |
| `modules/email/send.ts` | VOLLEDIG HERSCHREVEN | Welkomstmails voor alle drie plannen + Resend template support |
| `app/api/billing/webhook/route.ts` | GEWIJZIGD | `sendPurchaseWelcomeEmail()` aangeroepen bij one_time + subscription |
| `.env.local.example` | GEWIJZIGD | Resend template IDs ingevuld |
| `docs/TASKS.md` | GEWIJZIGD | BILLING-002 + AUTH-002 toegevoegd aan backlog |

**Vercel env vars toegevoegd in sessie 7:**
- `RESEND_TEMPLATE_WELCOME_ONE_TIME=103d7be2-e2a6-48e6-9c29-5db48de2b338`
- `RESEND_TEMPLATE_WELCOME_MONTHLY=11387950-bdd2-4e81-bf5c-fde9f60d1baa`
- `RESEND_TEMPLATE_WELCOME_YEARLY=02824f32-0da5-407c-b44e-3b89c0ea2d52`

**Branch:** `main`
**Status:** Gepusht naar GitHub, live op Vercel

---

## VOLGENDE GEPLANDE STAP

**STRIPE-LIVE** — zie "EERSTE TAAK VOLGENDE SESSIE" bovenin.

Na STRIPE-LIVE:
- LEGAL-001 (aparte sessie): privacy policy, verwerkersovereenkomsten, algemene voorwaarden, cookie-beleid
- BILLING-002 (aparte sessie — briefing eerst): analyse-limieten + credit top-up
- AUTH-002: 2FA banner in dashboard

---

## WAT WERKT

- Supabase authenticatie (email/password) — verificatiemail via Resend SMTP
- DBA analyse via Claude Haiku (`claude-haiku-4-5-20251001`)
- Twee-fase architectuur: fase 1 = snelle kernanalyse (~5-8s), fase 2 = draft op aanvraag
- Input validatie (minimum 800 tekens / 120 woorden)
- Follow-up vragen als invulvelden op resultaatpagina
- Nuclear/coerce validator — altijd succesvol voor geldige JSON objecten
- Resultaatpagina UI: colored hero banner, 3-koloms domeinkaarten, actiepunten
- Draft generatie op expliciete knopklik
- Gesplitste draft generatie: compact (max_tokens 700) + uitgebreid (max_tokens 2000, lazy)
- Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft?mode=compact|full`)
- PDF rapport generatie
- Rate limiting op analyse endpoint (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- Stripe subscription checkout — TEST-002 BEVESTIGD WERKEND
- Stripe one-time checkout
- Stripe webhook handler — TEST-003 BEVESTIGD WERKEND
- Conversie-funnel: modal signUp → verifyscherm → checkout → `/dashboard`
- Paywall — `/upgrade` paywallpagina met 3 plankaarten
- One-time upsell e-mail via Resend
- Welkomstmails voor alle drie plannen via Resend Templates
- Nederlandstalige foutmeldingen (auth-errors.ts)
- Newsfeed, notificaties, documentbeheer
- Loops marketing automation (quick_scan, subscription events, 3 journeys actief)
- PostHog analytics (ANAL-001/002/003)
- Sentry error tracking
- Quick scan landing page (twee pricing tiles)
- Proxy middleware: ?next= redirect, public routes correct
- Digest cron endpoints: weekly + monthly (LOOPS-003)

## WAT NIET WERKT / ONZEKER

- **STRIPE-LIVE**: Stripe staat nog in test mode. Vereist vóór productieomzetting.
- **OPEN**: TEST-005 — maximale invoerlengte (3000+ tekens) nog niet manueel getest.
- **OPEN**: MAIL-001 — `info@dbakompas.nl` instellen in Apple Mail. Niet blokkerend.
- **OPEN**: LOOPS-002 resterende actie — oude journeys verwijderen bij definitieve livegang.
- **GEDEELTELIJK**: Unit + integratietests aanwezig (80 totaal). E2e-tests ontbreken.
- **SANDBOX-ISSUE**: `npm test` faalt lokaal in ARM64 sandbox door ontbrekende `@rollup/rollup-linux-arm64-gnu`. Op Vercel en Mac werkt het correct.

---

## DEPLOYMENT STATUS

| Omgeving | Status | Onderbouwing |
|---|---|---|
| Lokaal | WERKEND | 80 tests groen (QUAL-001/002/003) |
| Vercel (main branch) | LIVE op `dbakompas.nl` | Auto-deploy via GitHub, custom domain + SSL actief |
| Vercel config | GEDOCUMENTEERD | `vercel.json` aanwezig (fra1, www-redirect, crons) |
| DNS | Cloudflare ACTIVE | Nameservers: brett + peaches.ns.cloudflare.com |

---

## INTEGRATIE STATUS

| Systeem | Code aanwezig | Geconfigureerd | Live getest |
|---|---|---|---|
| Supabase Auth + DB | JA | JA | BEVESTIGD |
| Supabase SMTP (Resend) | N.V.T. | JA — smtp.resend.com:465 ✅ | BEVESTIGD ✅ (sessie 7) |
| Anthropic Claude Haiku | JA | JA | BEVESTIGD |
| Stripe (checkout + webhook) | JA | JA (test mode) | TEST-002 + TEST-003 BEVESTIGD ✅ |
| Resend (transactioneel) | JA | JA — domein + API key + templates ✅ | GEDEELTELIJK |
| Loops | JA | JA — dbakompas.nl sending domain ✅ | Journey B live + getest ✅ |
| PostHog | JA | JA | ONBEKEND |
| Sentry | JA | JA | ONBEKEND |

---

## ARCHITECTUUR OORDEEL

Correct gestructureerd:
- Business logic in `lib/` en `modules/`, niet in UI components
- Alle AI-aanroepen via `claude-haiku-4-5-20251001`
- Supabase admin voor server-side mutaties (RLS bypass correct)
- Entitlements via `modules/billing/entitlements.ts`
- Paywall via `AuthContext` plan state + `AppShell` redirect (client-side, voldoende voor MVP)
- Prompt injection beveiliging aanwezig
- Stripe coupon via server-side `discounts` parameter (nooit client-exposed)
- Auth foutmeldingen centraal vertaald via `lib/auth-errors.ts`

Aandachtspunten:
- `postProcessDbaOutput` verwerkt draft-velden die fase 1 niet levert (no-ops, gedocumenteerd)
- 80 unit + integratietests aanwezig — e2e ontbreekt nog
- Paywall is client-side — server-side middleware zou robuuster zijn, voldoende voor MVP
