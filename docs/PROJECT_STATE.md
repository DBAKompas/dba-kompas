# PROJECT_STATE.md

**Laatste update:** 2026-04-26 (sessie 28)
**Maturity:** Live, actief in ontwikkeling — MVP compleet, groei-features actief

---

## SAMENVATTING

DBA Kompas is een **live** Next.js 16 SaaS applicatie op `dbakompas.nl` die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De app is volledig functioneel met betaalde gebruikers.

---

## WAT LIVE IS (volledig operationeel)

- Authenticatie (Supabase, custom SMTP via Postmark, magic link, wachtwoordreset)
- DBA-analyse via Claude Haiku (two-phase, nuclear validator, PDF export)
- Quota-cap per plan (monthly 20/mnd, yearly 25/mnd, one_time 1x, free 0)
- Stripe subscription + one-time checkout (live mode actief)
- Stripe webhooks (signature-validatie + idempotency)
- Welkomstmails na betaling (Postmark — 3 templates actief)
- Guest checkout (geen wachtwoord vooraf vereist)
- Loops marketing automation
- PostHog analytics
- Sentry error tracking — **volledig actief** (server + edge + client via instrumentation hooks)
- Control Tower (admin dashboard):
  - Gebruikersbeheer met filters
  - Meldingen-pagina met oplossingsadvies per type
  - Referral overzicht, analyses, funnel, nieuws, e-mails, tests
- Admin alerts (Postmark-mail bij kritieke events, GitHub Actions cron elke 10 min)
- In-app notificaties: analyse klaar ✅, betaling mislukt ✅, abonnement verlengd ✅, nieuw nieuws ✅
- Referral systeem — 5 eenmalige codes, mijlpalen 1/3/5 met Stripe-rewards
- LinkedIn Insight Tag op marketing site ✅
- 20 LinkedIn-promotiecodes (coupon `LINKEDIN-GRATIS-CHECK`) ✅
- `allow_promotion_codes: true` bij Stripe checkout ✅

---

## DEPLOYMENT STATUS

| Onderdeel | Status |
|---|---|
| Vercel (main branch) | **LIVE** op `dbakompas.nl` |
| Supabase Auth | **ACTIEF** — custom SMTP via Postmark |
| Stripe | **LIVE MODE** — subscriptions + webhooks actief |
| Postmark | **ACTIEF** — DKIM + Return-Path verified |
| Loops | **ACTIEF** |
| PostHog | **ACTIEF** |
| Sentry | **VOLLEDIG ACTIEF** — alle drie runtimes |
| LinkedIn Insight Tag | **ACTIEF** |
| GitHub Actions cron | **ACTIEF** — pending-alerts elke 10 min |

---

## SUPABASE MIGRATIES (alle uitgevoerd)

001 initial schema · 002 full schema · 003 role profiles · 004 referral tabellen ·
005 admin alerts · 006 welcome tokens · 007 usage counters · 008 alert triggers ·
009 test results · 010 referral 5 codes

---

## BACKLOG (prioriteitsvolgorde)

1. **QUAL-001** — Heranalyse met diff + Word-download rapport
2. **Postmark-templates** — `{{ activate_link }}` + `{{ login_link }}` toevoegen
3. **TEST-005** — Maximale invoerlengte (3000+ tekens) handmatig testen
4. **MAIL-001** — info@dbakompas.nl in Apple Mail
5. **Polish** — Loops journeys nieuws/betaling, Sentry source maps, Supabase key-migratie

---

## BEKENDE PRE-EXISTING TS-FOUTEN (geen blocker, `ignoreBuildErrors: true`)

- `app/api/admin/stats/route.ts` regel 38
- `lib/ai/dbaAnalysis.ts` regels 507/573
- `lib/pdf/generate.ts` regel 134
- `next.config.ts`: `eslint` niet in NextConfig type

---

## ARCHITECTUUR-NOTITIES

- Profiles-lookup: altijd `.eq('user_id', user.id)` — nooit `.eq('id', user.id)`
- Supabase `.in('column', [])` met lege array altijd bewaken met `if (ids.length > 0)`
- Stripe API lokaal pinnen op `apiVersion: '2025-03-31.basil'` (productie SDK is nieuwer)
- E-mail huisstijl: #0F1A2E bg, #1A2438 card, #F5A14C accent, logo white-v3-full
- Admin e-mail: `marvin.zoetemelk@icloud.com` (iCloud-inbox checken voor alerts)
