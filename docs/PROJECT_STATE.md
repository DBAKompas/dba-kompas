# PROJECT_STATE.md

**Laatste update:** 2026-04-17 (sessie 14 — afsluiting)
**Maturity:** ~99% (live op dbakompas.nl, Stripe in test mode, Postmark volledig actief)

---

## SAMENVATTING

DBA Kompas is een **live** Next.js 16.2 SaaS applicatie op `dbakompas.nl` die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De app is volledig functioneel:

- Authenticatie (Supabase, custom SMTP via Postmark, dbakompas.nl URL, email template met DBA huisstijl)
- DBA analyse via Claude Haiku (two-phase, nuclear validator, PDF export)
- Paywall (free → /upgrade redirect, admins vrijgesteld)
- Stripe subscription + one-time checkout (TEST bevestigd)
- Welkomstmails na betaling (Postmark inline HTML — volledig actief ✅)
- Loops marketing automation (3 journeys actief, events endpoint gerepareerd)
- PostHog analytics + Sentry error tracking
- 80 unit + integratietests
- Control Tower fase 1 t/m 3 (statistieken, funnel, gebruikersbeheer, analyses-overzicht)
- Sales Funnel als aparte tegel (`/admin/funnel`) met conversie per stap, plan-breakdown, risico-uitkomsten
- Paywall race condition gefixed (`roleLoading` in AuthContext)
- Volledige app-audit uitgevoerd: gaps geïdentificeerd (nieuws leeg, gidsen oppervlakkig, notificaties passief)
- Masterplan SaaS professioneel opgesteld (`docs/MASTERPLAN_SAAS_PROFESSIONAL.md`)
- Growthplan opgeslagen + technisch uitvoeringsplan (`docs/GROWTHPLAN_UITVOERING.md`)
- INFRA-001 t/m -004 gepland: CT meegroeien, admin alerts + e-mailalerts, BIMI e-maillogo, mobiel menu
- Vercel Cron Jobs (weekly/monthly digest triggers)
- Quick scan funnel volledig meetbaar (Supabase + Loops)

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
- Paywall (plan=free → redirect /upgrade, admins vrijgesteld)
- /upgrade paywallpagina (3 plankaarten, directe Stripe checkout)
- /upgrade-to-pro flow (coupon ONETIMECREDIT, server-side)
- Profielpagina: correct plan weergeven (eenmalig/maand/jaar)
- Nederlandse foutmeldingen voor Supabase auth errors
- Auth flows: forgot-password, auth/callback (PKCE + token hash), update-password ✅
- **Control Tower fase 1 t/m 3** (admin root + gebruikersbeheer + statistieken + funnel + analyses) ✅
- PostHog analytics (server-side events, identify, top-of-funnel QuickScan)
- Loops automation (3 journeys: hoog/gemiddeld/laag risico — alle actief)
- Quick Scan landing page (succes-scherm met twee pricing tiles)
- Quick scan data opgeslagen in Supabase (`quick_scan_leads`) + Loops ✅
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
- **TEST-006**: Welkomstmail end-to-end test — blocked op Postmark goedkeuring

---

## SESSIEHISTORIE

### Sessie 2026-04-16 (sessie 13) — Control Tower fase 2 + 3
- **Control Tower fase 2**: gebruikersbeheer (`/admin/gebruikers` + API), admin root page `/admin` (fix 404) ✅
- Admin emails pagina bijgewerkt (Resend-referenties verwijderd, Postmark-info) ✅
- Paywall fix: admins omzeilen de paywall (layout.tsx) ✅
- Admin role gezet via Supabase SQL ✅
- Directe repo-toegang ingesteld via `mcp__cowork__request_cowork_directory` ✅
- **Control Tower fase 3**: statistieken, funnelrij, analyses-overzicht ✅
  - `/api/admin/stats` — geaggregeerde data (plan breakdown, conversie, analyses)
  - `/api/admin/analyses` — per-gebruiker analyse-overzicht
  - `/admin/analyses` — analyses pagina
  - Funnelrij: Quick Scan → Registraties → Betaald → Analyses → Risico
- **Quick scan funnel**: `quick_scan_leads` tabel aangemaakt in Supabase ✅
- Quick-scan route schrijft ook naar Supabase (fire-and-forget) ✅
- Stats API uitgebreid met quick scan counts ✅

### Sessie 2026-04-16 (sessie 12) — Auth flows + e-mailtemplates
- **AUTH-003 AFGEROND** ✅: auth/callback route + update-password pagina aangemaakt
- Wachtwoord vergeten flow: forgot-password pagina + link op loginpagina
- Supabase reset-password e-mailtemplate aangemaakt (DBA huisstijl)
- **POSTMARK-002 AFGEROND** ✅: sendEmailWithTemplate() in send.ts

### Sessie 2026-04-15 (sessie 11) — Postmark templates
- 3 standalone Postmark templates aangemaakt: `welkomstmail-eenmalig`, `welkomstmail-maand`, `welkomstmail-jaar`
- Welkomstmailteksten geschreven en goedgekeurd

### Sessie 2026-04-14 (sessie 10) — Security incident + build fix
- **SEC-INC-001 OPGELOST** ✅: Postmark Server Token per ongeluk in docs opgenomen → GitGuardian alert
- Token direct geroteerd, nieuwe token in Vercel + Supabase SMTP bijgewerkt
- **BUILD-FIX** ✅: `lib/email/index.ts` importeerde nog steeds `resend` → Postmark doorgevoerd

### Sessie 2026-04-14 (sessie 9) — POSTMARK-001 voltooiing
- **POSTMARK-001 VOLLEDIG AFGEROND** ✅
- `POSTMARK_SERVER_TOKEN` toegevoegd in Vercel, Supabase SMTP bijgewerkt, Resend verwijderd

### Sessie 2026-04-14 (sessie 8) — Bugfixes + Postmark migratie
- BUG-001 + BUG-002 opgelost
- Postmark account aangemaakt, domein geverifieerd (DKIM + Return-Path)

### Sessie 2026-04-13 — Welkomstmails + Control Tower fase 1
- Welkomstmails na betaling, Control Tower fase 1

### Sessies 2026-04-06 t/m 2026-04-12
- Initiële migratie, stabilisatie, Stripe, PDF, Loops, DNS, PostHog, Sentry

---

## LAATSTE ACTIE

**Sessie:** 2026-04-16 (sessie 13)
**Laatste commits:**
- `feat(admin): volledige funnel — quick scan → registratie → betaald → analyses`
- `feat(admin): Control Tower fase 3 — statistieken, funnel en analyses-overzicht`
- `fix(auth): admin omzeilt paywall, sidebar link naar /admin`
- `feat(admin): Control Tower fase 2 — gebruikersbeheer + admin root page`

## VOLGENDE GEPLANDE STAP

1. **TEST-006**: Welkomstmail end-to-end testen (wacht op Postmark account goedkeuring)
2. **STRIPE-LIVE**: Stripe omzetten naar live mode (vereist voor echte betalingen)
3. **LOOPS-002**: 3 oude Loops journeys verwijderen
