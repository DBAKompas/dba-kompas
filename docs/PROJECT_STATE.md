# PROJECT_STATE.md

**Laatste update:** 2026-04-15 (sessie 11)
**Maturity:** ~99% (live op dbakompas.nl, Stripe in test mode, Postmark volledig actief)

---

## SAMENVATTING

DBA Kompas is een **live** Next.js 16.2 SaaS applicatie op `dbakompas.nl` die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De app is volledig functioneel:

- Authenticatie (Supabase, custom SMTP via Postmark, dbakompas.nl URL, email template met DBA huisstijl)
- DBA analyse via Claude Haiku (two-phase, nuclear validator, PDF export)
- Paywall (free → /upgrade redirect)
- Stripe subscription + one-time checkout (TEST bevestigd)
- Welkomstmails na betaling (Postmark — volledig actief ✅)
- Loops marketing automation (3 journeys actief, events endpoint gerepareerd)
- PostHog analytics + Sentry error tracking
- 80 unit + integratietests
- Control Tower fase 1 (admin e-mailbeheer, rolgebaseerde toegang)
- Vercel Cron Jobs (weekly/monthly digest triggers)

**Status e-mailinfrastructuur:** Postmark volledig operationeel. DKIM + Return-Path geverifieerd, `POSTMARK_SERVER_TOKEN` in Vercel, Supabase SMTP bijgewerkt. Resend volledig verwijderd.

---

## DEPLOYMENT STATUS

| Omgeving | Status |
|---|---|
| Vercel (main branch) | **LIVE** op `dbakompas.nl` — auto-deploy via GitHub |
| Supabase Auth | **ACTIEF** — custom SMTP via Postmark (`smtp.postmarkapp.com:587`) ✅ |
| Stripe | **TEST MODE BEVESTIGD** (TEST-002 + TEST-003) — live mode pending |
| Resend | **VOLLEDIG VERWIJDERD** — code, npm package en alle Vercel env vars weg |
| Postmark | **VOLLEDIG ACTIEF** ✅ — DKIM + Return-Path verified, token in Vercel, Supabase SMTP bijgewerkt |
| Loops | **ACTIEF** — events endpoint gecorrigeerd (was `/events`, nu `/events/send`) |
| PostHog | **GEÏNTEGREERD** — live |
| Sentry | **GEÏNTEGREERD** — live |

---

## WAT WERKT

- Supabase authenticatie (email/password, magic link, verificatiemail van noreply@dbakompas.nl)
- DBA analyse via Claude Haiku (`claude-haiku-4-5-20251001`), two-phase architectuur
- Input validatie (minimum 800 tekens / 120 woorden)
- Follow-up vragen als invulvelden, heranalyse
- Nuclear/coerce validator — altijd succesvol voor geldige JSON
- Resultaatpagina UI: colored hero banner, 3-koloms domeinen, actiepunten
- Draft generatie (compact / full mode, lazy loading)
- PDF rapport generatie (correct opgemaakt, leesbare tekst)
- Rate limiting (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- Stripe subscription checkout — TEST-002 BEVESTIGD ✅
- Stripe one-time checkout — gecorrigeerd en werkend
- Stripe webhook handler — TEST-003 BEVESTIGD ✅
- Conversie-funnel: modal signUp → verifyscherm → checkout → /dashboard
- Paywall (plan=free → redirect /upgrade)
- /upgrade paywallpagina (3 plankaarten, directe Stripe checkout)
- /upgrade-to-pro flow (coupon ONETIMECREDIT, server-side)
- Profielpagina: correct plan weergeven (eenmalig/maand/jaar)
- Nederlandse foutmeldingen voor Supabase auth errors
- Control Tower fase 1 (admin e-mailbeheer + rolgebaseerde sidebar-toegang)
- PostHog analytics (server-side events, identify, top-of-funnel QuickScan)
- Loops automation (3 journeys: hoog/gemiddeld/laag risico — alle actief)
- Quick Scan landing page (succes-scherm met twee pricing tiles)
- Sentry error tracking
- Vercel Cron Jobs (weekly/monthly digest endpoints)
- 80 unit + integratietests
- NEXT_PUBLIC_APP_URL correct ingesteld in Vercel ✅
- Loops `subscription_started` event endpoint gecorrigeerd ✅

## WAT NIET WERKT / PENDING

- **STRIPE LIVE MODE**: niet geconfigureerd — VEREIST VOOR ECHTE BETALINGEN
- **Loops**: 3 oude journeys nog te verwijderen (laag risico)
- **TEST-005**: maximale invoerlengte (3000+ tekens) nog niet handmatig getest
- **MAIL-001**: info@dbakompas.nl nog niet in Apple Mail
- **Welkomstmails**: Postmark templates klaar (`welkomstmail-eenmalig`, `welkomstmail-maand`, `welkomstmail-jaar`), code nog niet aangepast naar `sendEmailWithTemplate()`, end-to-end test nog uitvoeren

---

## SESSIEHISTORIE

### Sessie 2026-04-06 — Initiële migratie
- 10 migratiefases van Replit naar Next.js 16 / Supabase / Vercel via Claude Code (46 min)

### Sessie 2026-04-07 — Stabilisatie, AI, landing page
- AI-fixes (JSON, retry, truncation), two-phase architectuur
- OpenAI → Anthropic Claude Haiku
- Landing page gemigreerd naar Next.js marketing route group
- Rate limiting, security, debug endpoint verwijderd

### Sessie 2026-04-08 — Stripe, PDF, Loops
- Stripe checkout fixes (critieke env var mismatch opgelost)
- PDF volledig redesigned (compact, correct opgemaakt)
- Loops quick-scan endpoint gebouwd
- PERF-001: draft gesplitst in compact/full mode

### Sessie 2026-04-09 — Conversie-funnel, paywall, tests
- Volledige conversie-funnel hersteld (register, checkout-redirect, signup)
- EmailCheckoutModal geconsolideerd
- FEAT-004: Paywall geïmplementeerd
- FEAT-005: One-time upsell e-mail + upgrade flow
- Stripe TEST-002 + TEST-003 bevestigd werkend ✅
- QUAL-001 + QUAL-002: 67 tests aangemaakt
- DOC-001: vercel.json + DEPLOYMENT.md aangemaakt

### Sessie 2026-04-10 — DNS migratie, PostHog, Loops journeys
- INFRA-001: DNS migratie naar Cloudflare gestart
- ANAL-001/002/003: PostHog volledig geïntegreerd
- UX-001/001b: Quick Scan succes-scherm herbouwd
- LOOPS-002: 3 Loops journeys aangemaakt
- QUAL-003: 13 unit tests voor lib/loops
- SEC-003: proxy.ts verbeterd, ?next= redirect

### Sessie 2026-04-11 — LOOPS-003, doc-sync
- LOOPS-003: Vercel Cron Jobs voor digest trigger
- Doc-sync: 9 commits gesynchroniseerd

### Sessie 2026-04-12 — INFRA-001 voltooiing + doc-sync
- Cloudflare NS actief, Resend domein geverifieerd
- Supabase SMTP ingesteld, e-mailtemplate DBA huisstijl
- Vercel custom domain dbakompas.nl gekoppeld
- App is LIVE op dbakompas.nl ✅
- Doc-sync sessie 6

### Sessie 2026-04-13 — Welkomstmails + Control Tower fase 1
- Nederlandse foutmeldingen voor Supabase auth errors
- Welkomstmails na betaling via Resend Templates (subscription + one-time)
- Logo-white-v3-full.png toegevoegd aan public map
- Welkomstmail copy + template IDs + full-width fix
- Resend Templates integratie voor welkomstmails
- Gecombineerd: één welkomstmail na eenmalige aankoop (welcome + upsell in één template)
- Profielpagina: correct plan tonen (eenmalig/maand/jaar) + logo upgrade pagina fix
- BrandLogo component op upgrade pagina
- **Control Tower fase 1**: admin e-mailbeheer + rolgebaseerde sidebar-toegang

### Sessie 2026-04-14 — Bugfixes + Postmark migratie (sessie 8)
- **INFRA-001 VOLLEDIG AFGEROND** ✅
  - NEXT_PUBLIC_APP_URL en RESEND_API_KEY waren al correct in Vercel
  - Supabase logo al correct ingesteld
  - Testaccount aangemaakt → welkomstmail bug ontdekt
- **BUG-001 OPGELOST**: Resend SDK ondersteunt `template_id` niet → inline HTML geforceerd
  - Commit: `b766fb7` — `modules/email/send.ts`
- **BUG-002 OPGELOST**: Loops events endpoint URL miste `/send`
  - Commit: `0545c90` — `lib/loops/index.ts`
- **POSTMARK MIGRATIE GESTART (80% klaar)**:
  - `npm uninstall resend` + `npm install postmark` uitgevoerd
  - `modules/email/send.ts` volledig herschreven met Postmark SDK
  - Cloudflare DNS: DKIM TXT + Return-Path CNAME toegevoegd → beide VERIFIED ✅
  - Postmark Server Token: `[POSTMARK_SERVER_TOKEN]`
  - Code gepusht naar GitHub (auto-deploy Vercel)

### Sessie 2026-04-15 — Postmark templates (sessie 11)
- 3 standalone Postmark templates aangemaakt: `welkomstmail-eenmalig`, `welkomstmail-maand`, `welkomstmail-jaar`
- Welkomstmailteksten geschreven en goedgekeurd
- `modules/email/send.ts` nog aan te passen naar `sendEmailWithTemplate()` (volgende sessie)

### Sessie 2026-04-15 — Postmark templates (sessie 11)
- 3 standalone Postmark templates aangemaakt: `welkomstmail-eenmalig`, `welkomstmail-maand`, `welkomstmail-jaar`
- Welkomstmailteksten geschreven en goedgekeurd
- `modules/email/send.ts` nog aan te passen naar `sendEmailWithTemplate()` (volgende sessie)

### Sessie 2026-04-14 — Security incident + build fix (sessie 10)
- **SEC-INC-001 OPGELOST** ✅: Postmark Server Token per ongeluk in docs opgenomen → GitGuardian alert
  - Token direct geroteerd in Postmark dashboard
  - Nieuwe token gezet in Vercel + Supabase SMTP bijgewerkt
  - Tokenwaarde verwijderd uit docs (commit `e5f165d`)
- **BUILD-FIX** ✅: `lib/email/index.ts` importeerde nog steeds `resend` → Postmark doorgevoerd (commit `4f9df24`)
- Deployment: Ready op `dbakompas.nl` ✅

### Sessie 2026-04-14 — POSTMARK-001 voltooiing (sessie 9)
- **POSTMARK-001 VOLLEDIG AFGEROND** ✅
  - `POSTMARK_SERVER_TOKEN` toegevoegd in Vercel (All Environments)
  - Supabase SMTP bijgewerkt: host `smtp.postmarkapp.com`, port `587`, username/password = Server Token
  - Alle Resend Vercel env vars verwijderd (`RESEND_API_KEY`, `RESEND_TEMPLATE_WELCOME_*`)
  - Resend volledig verwijderd uit stack

---

## LAATSTE ACTIE

**Sessie:** 2026-04-14 (sessie 10)
**Laatste commits:**
- `4f9df24` — "fix: vervang Resend door Postmark in email modules"
- `e5f165d` — "security: verwijder blootgestelde Postmark token uit docs"
- `b766fb7` — "fix: welkomstmail via inline HTML — Resend SDK ondersteunt template_id niet"
- `0545c90` — "fix: Loops events endpoint URL — /send ontbrak"
- (Postmark send.ts commit — naam onbekend, gepusht door Marvin)

**Laatste wijziging in code:**
- `modules/email/send.ts`: volledig herschreven van Resend naar Postmark SDK
- `lib/loops/index.ts`: LOOPS_EVENTS_URL gecorrigeerd naar `/api/v1/events/send`
- `package.json` + `package-lock.json`: `resend` verwijderd, `postmark` toegevoegd

## VOLGENDE GEPLANDE STAP

**EERSTE TAAK: Welkomstmail end-to-end testen + daarna STRIPE-LIVE**

### Stap 1 — Welkomstmail testen (POSTMARK-001 verificatie)
- Doe een test-betaling op dbakompas.nl (Stripe test card)
- Verifieer welkomstmail in inbox
- Check Postmark Activity feed: mail zichtbaar?
- Check Vercel logs: geen `[MAIL] skipped` of errors

### Stap 2 — STRIPE-LIVE configureren (vereist voor echte betalingen)
- Live Stripe keys in Vercel: `STRIPE_SECRET_KEY` (sk_live_...) + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Live webhook aanmaken: `https://dbakompas.nl/api/billing/webhook`
- Live price IDs + coupon `ONETIMECREDIT` in Stripe live mode
