# TASKS.md

**Laatste update:** 2026-04-16 (sessie 13)

---

## IN PROGRESS

### CT-001 — Statistieken en funnel zichtbaar maken in Control Tower
- [ ] Controleer of laatste commits zijn gepusht (`feat(admin): volledige funnel...` + `feat(admin): Control Tower fase 3...`)
- [ ] Na deploy: verifieer dat statcards en funnelrij zichtbaar zijn op `/admin`
- [ ] Quick scan data verschijnt pas na de eerste nieuwe quick scan (tabel `quick_scan_leads` is leeg bij aanvang)
- [ ] Eventueel: historische quick scan data backfillen vanuit Loops contacts API

### TEST-006 — Welkomstmail end-to-end testen via Postmark
- [ ] Wacht op Postmark account goedkeuring (aangevraagd)
- [ ] Na goedkeuring: test-betaling uitvoeren op dbakompas.nl (Stripe test card)
- [ ] Welkomstmail ontvangen in inbox verifiëren
- [ ] Postmark Activity feed: mail zichtbaar?
- [ ] Vercel logs: geen `[MAIL] skipped` of errors

---

## TODO

### HOOG — Vereist voor productie-livegang

**STRIPE-LIVE: Stripe omzetten naar live mode**
- [ ] Live Stripe keys instellen in Vercel: `STRIPE_SECRET_KEY` (sk_live_...) + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] Live webhook aanmaken in Stripe Dashboard: `https://dbakompas.nl/api/billing/webhook` (5 events)
- [ ] Nieuw `STRIPE_WEBHOOK_SECRET` uit live webhook → Vercel
- [ ] Live price IDs: `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, `STRIPE_PRICE_ID_ONE_TIME`
- [ ] Coupon `ONETIMECREDIT` aanmaken in Stripe live mode + env var
- [ ] End-to-end live betaling testen

### MIDDEL

~~**LOOPS-002: Oude journeys verwijderen** — AFGEROND ✅~~

**MAIL-001: info@dbakompas.nl in Apple Mail**
- [ ] IMAP: `imap.strato.de`, poort 993, SSL/TLS
- [ ] SMTP: `smtp.strato.de`, poort 465, SSL/TLS
- [ ] Gebruikersnaam: `info@dbakompas.nl`

**TEST-005: Edge case — maximale invoerlengte**
- [ ] Analyse uitvoeren met 3000+ tekens invoer
- [ ] Verifieer: geen truncation, geen timeout, correcte output

### LAAG — Geen haast

**AUTH-002: 2FA aanbevelen (niet verplicht)**
- [ ] Supabase TOTP-check: `supabase.auth.mfa.listFactors()`
- [ ] Als geen verified factor: banner in dashboard met "Beveilig je account"
- [ ] Link naar `/dashboard/beveiliging` met TOTP-setup flow
- [ ] Wegklikbaar (dismissed state in profiles)

**BILLING-002: Analyse-limieten + credit top-up**
> Werkwijze: BEGIN MET BRIEFING. Niet starten met bouwen.
- [ ] Briefing: wat levert het op, wat kost het, welke keuzes?
- [ ] Beslissen: limieten per plan, credits-model, UI voor resterende credits
- [ ] Dan pas: Supabase kolommen + API check + pg_cron reset + Stripe product

**LEGAL-001: Juridische documenten herzien**
- [ ] Privacy policy: Cloudflare, Postmark, Loops als verwerkers
- [ ] Verwerkersovereenkomsten controleren
- [ ] Algemene voorwaarden DBA-implicaties
- [ ] Cookie-beleid (Cloudflare)

**FEAT-002: Admin panel voor contentbeheer (gidsen, nieuws)**

**FEAT-003: Gidsen content schrijven en vullen**

---

## DONE

### Sessie 2026-04-16 (sessie 13) — Control Tower fase 2 + 3
- [x] **Control Tower fase 2** ✅
  - `/admin/page.tsx` — root admin dashboard (fix 404)
  - `/admin/gebruikers/page.tsx` — gebruikerslijst met plan, rol, wachtwoord-reset
  - `/api/admin/gebruikers/route.ts` — GET (lijst) + POST (reset password)
  - `/admin/emails/page.tsx` — Resend-referenties verwijderd, Postmark-info toegevoegd
- [x] Paywall fix: admins omzeilen de paywall (`layout.tsx`) ✅
- [x] Admin role gezet via Supabase SQL (`role = 'admin'`) ✅
- [x] Directe repo-toegang via `mcp__cowork__request_cowork_directory ~/dba-kompas` ✅
- [x] **Control Tower fase 3** ✅
  - `/api/admin/stats` — gebruikers per plan, conversie, quick scan counts, analyse counts
  - `/api/admin/analyses` — per gebruiker: totaal, laag/gemiddeld/hoog, laatste datum
  - `/admin/analyses/page.tsx` — analyses-overzicht pagina
  - `/admin/page.tsx` verbeterd — 4 statcards + volledige funnelrij
- [x] **Quick scan funnel** ✅
  - `quick_scan_leads` tabel aangemaakt in Supabase
  - `/api/loops/quick-scan/route.ts` schrijft ook naar Supabase (fire-and-forget)
  - Funnel: Quick Scan → Registraties (%) → Betaald (%) → Analyses → Risico-uitkomsten

### Sessie 2026-04-16 (sessie 12) — Auth flows + e-mailtemplates
- [x] **AUTH-003 AFGEROND** ✅: auth/callback + update-password pagina
- [x] Wachtwoord vergeten flow: forgot-password pagina + loginpagina link ✅
- [x] Supabase reset-password e-mailtemplate (DBA huisstijl) ✅
- [x] **POSTMARK-002 AFGEROND** ✅: sendEmailWithTemplate() in send.ts

### Sessie 2026-04-15 (sessie 11) — Postmark templates
- [x] 3 standalone Postmark templates aangemaakt ✅
- [x] Welkomstmailteksten goedgekeurd en verwerkt ✅

### Sessie 2026-04-14 (sessie 10) — Security incident + build fix
- [x] **SEC-INC-001**: Postmark token geroteerd na GitGuardian alert ✅
- [x] Nieuwe token in Vercel + Supabase SMTP bijgewerkt ✅
- [x] Tokenwaarde verwijderd uit docs ✅
- [x] `lib/email/index.ts` + `modules/email/send.ts`: Resend → Postmark SDK ✅
- [x] Deployment: Ready op `dbakompas.nl` ✅

### Sessie 2026-04-14 (sessie 9) — POSTMARK-001 voltooiing
- [x] **POSTMARK-001 VOLLEDIG AFGEROND** ✅
- [x] `POSTMARK_SERVER_TOKEN` toegevoegd in Vercel (All Environments) ✅
- [x] Supabase SMTP bijgewerkt naar `smtp.postmarkapp.com:587` ✅
- [x] Resend env vars verwijderd uit Vercel ✅

### Sessie 2026-04-14 (sessie 8) — Bugfixes + Postmark migratie
- [x] **BUG-001 OPGELOST** ✅
- [x] **BUG-002 OPGELOST** ✅
- [x] Postmark account aangemaakt, domein geverifieerd (DKIM + Return-Path) ✅
- [x] `npm uninstall resend` + `npm install postmark` ✅

### Sessie 2026-04-13 — Welkomstmails + Control Tower fase 1
- [x] Nederlandse foutmeldingen voor Supabase auth errors ✅
- [x] Welkomstmails na betaling (Postmark inline HTML) ✅
- [x] **Control Tower fase 1** — admin e-mailbeheer + rolgebaseerde sidebar-toegang ✅

### Sessies 2026-04-06 t/m 2026-04-12
- [x] Initiële migratie (10 fases), stabilisatie, AI, Stripe, PDF, Loops, DNS, PostHog, Sentry, tests
