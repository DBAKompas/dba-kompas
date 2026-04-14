# TASKS.md

**Laatste update:** 2026-04-14 (sessie 10)

---

## IN PROGRESS

### TEST-006 — Welkomstmail end-to-end testen via Postmark
- [ ] Test-betaling uitvoeren op dbakompas.nl (Stripe test card)
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

**TEST-005: Edge case — maximale invoerlengte**
- [ ] Analyse uitvoeren met 3000+ tekens invoer
- [ ] Verifieer: geen truncation, geen timeout, correcte output

### MIDDEL

**AUTH-003: auth/callback + update-password pagina's deployen**
- [ ] `cp te-plaatsen-in-repo/app/auth/callback/route.ts app/auth/callback/route.ts`
- [ ] `cp te-plaatsen-in-repo/app/update-password/page.tsx app/update-password/page.tsx`
- [ ] Committen + pushen

**LOOPS-002 afronden: Oude journeys verwijderen**
- [ ] In Loops: verwijder `quick_scan_completed - high`
- [ ] In Loops: verwijder `quick_scan_completed - medium`
- [ ] In Loops: verwijder `quick_scan_completed - low`

**MAIL-001: info@dbakompas.nl in Apple Mail**
- [ ] IMAP: `imap.strato.de`, poort 993, SSL/TLS
- [ ] SMTP: `smtp.strato.de`, poort 465, SSL/TLS
- [ ] Gebruikersnaam: `info@dbakompas.nl`

**AUTH-002: 2FA aanbevelen (niet verplicht)**
- [ ] Supabase TOTP-check: `supabase.auth.mfa.listFactors()`
- [ ] Als geen verified factor: banner in dashboard met "Beveilig je account"
- [ ] Link naar `/dashboard/beveiliging` met TOTP-setup flow
- [ ] Wegklikbaar (dismissed state in profiles)

### LAAG — Geen haast

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

### Sessie 2026-04-14 (sessie 10) — Security incident + build fix
- [x] **SEC-INC-001**: Postmark token geroteerd na GitGuardian alert ✅
- [x] Nieuwe token in Vercel + Supabase SMTP bijgewerkt ✅
- [x] Tokenwaarde verwijderd uit docs (commit `e5f165d`) ✅
- [x] `lib/email/index.ts` + `modules/email/send.ts`: Resend → Postmark SDK (commit `4f9df24`) ✅
- [x] Deployment: Ready op `dbakompas.nl` ✅

### Sessie 2026-04-14 (sessie 9) — POSTMARK-001 voltooiing
- [x] **POSTMARK-001 VOLLEDIG AFGEROND** ✅
- [x] `POSTMARK_SERVER_TOKEN` toegevoegd in Vercel (All Environments) ✅
- [x] Supabase SMTP bijgewerkt naar `smtp.postmarkapp.com:587` ✅
- [x] Resend env vars verwijderd uit Vercel (`RESEND_API_KEY`, `RESEND_TEMPLATE_WELCOME_*`) ✅

### Sessie 2026-04-14 (sessie 8) — Bugfixes + Postmark migratie
- [x] **INFRA-001 VOLLEDIG AFGEROND** ✅ (NEXT_PUBLIC_APP_URL + RESEND_API_KEY waren al correct in Vercel, logo al correct)
- [x] **BUG-001 OPGELOST**: `sendPurchaseWelcomeEmail` stuurde lege mail — Resend SDK verwijdert onbekende velden zoals `template_id` → gefixed met inline HTML geforceerd (`b766fb7`)
- [x] **BUG-002 OPGELOST**: Loops `subscription_started` HTTP 404 — endpoint URL miste `/send` → `lib/loops/index.ts` gecorrigeerd (`0545c90`)
- [x] Postmark account aangemaakt, domein `dbakompas.nl` geverifieerd (DKIM + Return-Path) ✅
- [x] Cloudflare DNS: DKIM TXT + Return-Path CNAME toegevoegd en geverifieerd ✅
- [x] `npm uninstall resend` + `npm install postmark` uitgevoerd
- [x] `modules/email/send.ts` herschreven met Postmark SDK (inline HTML behouden)
- [x] Code gepusht naar GitHub (Vercel auto-deploy getriggerd)

### Sessie 2026-04-13 — Welkomstmails + Control Tower fase 1
- [x] `fix(auth)`: Nederlandse foutmeldingen voor Supabase auth errors
- [x] `feat(email)`: Welkomstmails na succesvolle betaling (Resend Templates)
- [x] `assets`: logo-white-v3-full.png toegevoegd aan public map
- [x] `feat(email)`: Resend Templates integratie voor welkomstmails
- [x] `feat(email)`: Welkomstmail copy + template IDs + full-width fix bijgewerkt
- [x] `fix`: BrandLogo component op upgrade pagina
- [x] `fix`: Profielpagina toont correct plan (eenmalig/maand/jaar) + logo upgrade pagina
- [x] `fix`: Één welkomstmail na eenmalige aankoop (welcome + upsell gecombineerd)
- [x] `feat`: **Control Tower fase 1** — admin e-mailbeheer + rolgebaseerde sidebar-toegang

### Sessie 2026-04-12 (sessie 5+6) — INFRA-001 DNS migratie + doc-sync
- [x] Cloudflare actief (NS-records gepropageerd) ✅
- [x] Resend domein `dbakompas.nl` geverifieerd ✅
- [x] Loops sending domain → `dbakompas.nl` ✅
- [x] Supabase SMTP geconfigureerd via Resend ✅
- [x] Supabase Site URL + Redirect URL → `dbakompas.nl` ✅
- [x] Supabase e-mailbevestiging ingeschakeld ✅
- [x] Supabase email template: DBA Kompas huisstijl ✅
- [x] Vercel custom domain `dbakompas.nl` + SSL ✅
- [x] SPF-record gecombineerd ✅
- [x] **App is LIVE op dbakompas.nl** ✅

### Sessie 2026-04-11 — LOOPS-003 + doc-sync
- [x] LOOPS-003: Vercel Cron Jobs voor weekly/monthly digest
- [x] Doc-sync: 9 commits gesynchroniseerd

### Sessie 2026-04-10 — DNS start, PostHog, Loops journeys, tests
- [x] QUAL-003: 13 unit tests voor lib/loops
- [x] SEC-003: proxy.ts verbeterd + ?next= redirect
- [x] ANAL-001/002/003: PostHog volledig geïntegreerd
- [x] UX-001/001b: Quick Scan succes-scherm herbouwd met pricing tiles
- [x] LOOPS-002: 3 journeys aangemaakt + Journey B actief + getest
- [x] INFRA-001 gestart (DNS migratie naar Cloudflare)

### Sessie 2026-04-09 — Conversie-funnel, paywall, Stripe tests
- [x] FEAT-004: Paywall geïmplementeerd
- [x] FEAT-005: One-time upsell e-mail + upgrade flow + Stripe coupon ONETIMECREDIT
- [x] TEST-002: Stripe subscription checkout BEVESTIGD ✅
- [x] TEST-003: Stripe webhook delivery BEVESTIGD ✅
- [x] QUAL-001: 40 unit tests
- [x] QUAL-002: 21 integratietests
- [x] DOC-001: vercel.json + DEPLOYMENT.md

### Sessie 2026-04-08 — Stripe, PDF, Loops
- [x] FIX-010: buildFollowUpQuestions import fix
- [x] FIX-011: STRIPE_PRICE_ID_ONE_TIME env var fix (critiek)
- [x] FIX-012: trialing = Pro
- [x] PERF-001: draft compact/full gesplitst
- [x] FIX-PDF-001 t/m 005 + REFACTOR-PDF: volledig PDF redesign
- [x] LOOPS-001: /api/loops/quick-scan endpoint
- [x] TEST-001 + TEST-004: analyse flow + PDF getest

### Sessie 2026-04-07 — Stabilisatie, AI, landing page
- [x] OpenAI → Anthropic Claude Haiku
- [x] Two-phase architectuur (snelle kernanalyse + draft op aanvraag)
- [x] Nuclear/coerce validator
- [x] Rate limiting, SEC-001 (debug endpoint verwijderd), SEC-002
- [x] Landing page gemigreerd naar Next.js

### Sessie 2026-04-06 — Initiële migratie (10 fases)
- [x] Supabase SQL schema, AI services, API routes, app pagina's, AuthContext
- [x] PDF service, legal corpus, environment variables
