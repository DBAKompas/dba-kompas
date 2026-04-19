# TASKS.md

**Laatste update:** 2026-04-18 (sessie 19 — GROWTH-001 referral engine)

---

## IN PROGRESS

*(geen actieve taken)*

### TEST-006 — Welkomstmail end-to-end testen via Postmark
- [ ] Wacht op Postmark account goedkeuring (aangevraagd)
- [ ] Na goedkeuring: test-betaling uitvoeren op dbakompas.nl (Stripe test card)
- [ ] Welkomstmail ontvangen in inbox verifiëren
- [ ] Postmark Activity feed: mail zichtbaar?
- [ ] Vercel logs: geen `[MAIL] skipped` of errors

---

## TODO

### HOOG — Vereist voor productie-livegang

~~**GROWTH-001/002/003: Referral-engine** — AFGEROND ✅ (sessie 19, 2026-04-18)~~
- [x] `supabase/migrations/004_referral_engine.sql` — 3 tabellen + RLS + indexes
- [x] `lib/referral/engine.ts` — code generatie, tracking, kwalificatie, rewards, anti-fraud
- [x] `GET /api/referral/code` — eigen code ophalen/aanmaken + stats
- [x] `POST /api/referral/track` — referral koppelen aan gebruiker
- [x] `middleware.ts` — `?ref=CODE` → `dba_ref` cookie (30 dagen, httpOnly)
- [x] `auth/callback/route.ts` — cookie verwerken na registratie
- [x] `checkout/route.ts` — referral_code in Stripe session metadata
- [x] `webhook/route.ts` — referral kwalificeren + rewards bij mijlpalen 1/3/5
- [x] `components/referral/ReferralWidget.tsx` — widget na analyse met voortgang

**Openstaande handmatige acties voor Marvin:**
- [ ] **SQL uitvoeren** in Supabase Studio: inhoud van `supabase/migrations/004_referral_engine.sql`
- [ ] **Stripe coupon aanmaken:** Dashboard → Coupons → `REFERRAL_MONTH_DISCOUNT` (1 maand gratis)
- [ ] **Loops journeys:** events `referral_milestone_1`, `referral_milestone_3`, `referral_milestone_5`

~~**STRIPE-LIVE** — AFGEROND ✅ (sessie 16, 2026-04-18)~~

### HOOG — Infrastructuur & Operationeel (parallel aan product)

> Volledig plan in `docs/MASTERPLAN_SAAS_PROFESSIONAL.md`

**INFRA-001: Control Tower meegroeien met product**
- [ ] CT-root herinrichten met categoriegroepen zodra >6 tegels (Beheer / Analytics / Acties)
- [ ] Tegel "Nieuws" → `/admin/nieuws` toevoegen (bij PROD-001)
- [ ] Tegel "Gidsen" → `/admin/gidsen` toevoegen (bij PROD-002)
- [ ] Tegel "Referral" → `/admin/referral` toevoegen (bij GROWTH-001)
- [ ] Actiepunten-widget altijd bovenaan CT-root

**INFRA-002: Admin actiepunten & e-mailalerts**
- [ ] Supabase migratie 006: `admin_alerts` tabel
- [ ] `lib/admin/alerts.ts`: `createAlert()` + `sendAlertEmail()` via Postmark
- [ ] `app/api/admin/alerts/route.ts`: GET openstaande alerts
- [ ] `components/admin/AlertsWidget.tsx`: widget bovenaan CT-root
- [ ] Webhook uitbreiden: alert bij betalingsfout + e-mail naar marvin.zoetemelk@icloud.com
- [ ] Cron uitbreiden: alert bij mislukking
- [ ] Alert bij vermoedelijke referral-fraude (na GROWTH-001)
- [ ] Alert bij onverwacht nieuwe admin-rol

**INFRA-003: E-maillogo en BIMI**
- [ ] Niveau 1 (direct): DBA Kompas-logo consistent in alle Postmark-templates (welkomst, digest, alert, reset)
- [ ] Niveau 2 (later): DMARC controleren/instellen op `p=quarantine` bij Cloudflare
- [ ] SVG-logo aanmaken in BIMI Tiny PS-formaat
- [ ] SVG hosten op `dbakompas.nl/bimi-logo.svg`
- [ ] BIMI DNS-record toevoegen: `default._bimi.dbakompas.nl TXT "v=BIMI1; l=https://dbakompas.nl/bimi-logo.svg"`
- [ ] Testen via bimigroup.org/bimi-generator/
- [ ] DNS-acties: Marvin voert uit bij Cloudflare

~~**INFRA-004: Mobiele navigatie marketing site** — AFGEROND ✅~~

### HOOG — Product klaarstomen (vóór marktlancering)

> Volledig plan in `docs/MASTERPLAN_SAAS_PROFESSIONAL.md`

~~**PROD-001: Nieuws vullen** — BACKEND + ADMIN AFGEROND ✅ (sessie 16, 2026-04-18)~~
- [x] Admin pagina `/admin/nieuws`: toevoegen/bewerken nieuwsberichten ✅
- [x] `/api/admin/nieuws/route.ts` (GET + POST + PATCH + DELETE) ✅
- [x] `lib/news/sources.ts`: 5 RSS bronnen, trusted domains, DBA/ZZP keywords ✅
- [x] `lib/news/fetch.ts`: RSS fetch, AI herschrijf (Claude Haiku), dedup, cooldown, cleanup ✅
- [x] `/api/news/refresh/route.ts`: POST (auth+cooldown) + GET (Vercel cron) ✅
- [x] `/api/news/read/route.ts`: DB-persistente leesmarkering ✅
- [x] `app/(app)/nieuws/page.tsx`: impact/thema/bron-filters, ongelezen-tracking, feedback, bronvermelding ✅
- [x] `vercel.json`: cron elk uur voor automatische RSS refresh ✅
- [ ] SQL-migratie uitvoeren: `user_news_read` tabel aanmaken in Supabase Studio (zie onderaan DONE)
- [ ] Handmatig 15-20 berichten invoeren via admin (initieel vullen) of eerste RSS refresh triggeren

**PROD-002: Gidsen — content fase 1 AFGEROND ✅, admin editor pending**
- [x] Type-systeem (`GuideBlock`, `GuideEntry`) in `lib/guides/content.ts` ✅
- [x] 10 diepgaande gidsen geschreven (DBA, fiscaal, administratief, contracten, pensioen) ✅
- [x] Overzichtspagina herschreven: categorie-secties, moeilijkheidsgraad-badges, leestijd ✅
- [x] Detailpagina herschreven: gestijlde callouts (4 varianten), tabellen, genummerde lijsten, tag-cloud ✅
- [ ] Admin gids-editor `/admin/gidsen` (toekomstig — optioneel als content stabiel blijft in code)
- [ ] Supabase DB-migratie (optioneel — pas zinvol bij >25 gidsen of meerdere redacteuren)

**PROD-003: Notificaties als levend systeem**
- [ ] Trigger bij analyse: "Je analyse is klaar"
- [ ] Trigger bij hoog-impact nieuws: "Nieuw DBA-nieuws"
- [ ] Trigger bij betalingsfout: "Betaling mislukt"
- [ ] Trigger bij abonnementsverlenging

**QUAL-001: Analyse-ervaring verdiepen**
- [ ] Follow-up vragen flow na analyse (heranalyse met diff)
- [ ] Vergelijkingsgeschiedenis (v1 vs. v2)
- [ ] Word-download naast PDF
- [ ] Sector-context in analyse-output (IT vs. publiek domein)

**QUAL-004: Onboarding flow**
- [ ] Welkomstscherm na eerste login (3 bullets, 30 seconden)
- [ ] Direct naar analyse met voorbeeldtekst
- [ ] Na eerste analyse → referral-widget

### MIDDEL

~~**LOOPS-002: Oude journeys verwijderen** — AFGEROND ✅~~

~~**INFRA-004: Mobiele navigatie marketing site** — zie hierboven~~

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

### Sessie 2026-04-18 (sessie 19) — GROWTH-001/002/003 referral engine

- [x] **`supabase/migrations/004_referral_engine.sql`** ✅ — 3 tabellen: `referral_codes`, `referral_rewards`, `referral_tracking` met RLS, indexes, idempotency constraints
- [x] **`lib/referral/engine.ts`** ✅ — core engine: code generatie, tracking, kwalificatie, reward uitschrijving (mijlpalen 1/3/5), anti-fraud (zelfverwijzing, duplicaten), stats voor widget
- [x] **`GET /api/referral/code`** ✅ — code ophalen/aanmaken + statistieken (qualified count, rewards)
- [x] **`POST /api/referral/track`** ✅ — referral koppelen aan gebruiker (idempotent)
- [x] **`middleware.ts`** ✅ — `?ref=CODE` opslaan als `dba_ref` cookie (30 dagen, httpOnly, lax)
- [x] **`app/auth/callback/route.ts`** ✅ — cookie lezen bij registratie, trackReferral aanroepen
- [x] **`app/api/billing/checkout/route.ts`** ✅ — referral_code uit cookie → Stripe session metadata
- [x] **`app/api/billing/webhook/route.ts`** ✅ — na checkout: trackReferral + qualifyReferral, Loops events bij mijlpalen
- [x] **`components/referral/ReferralWidget.tsx`** ✅ — widget na analyse: persoonlijke URL, kopieer-knop, mijlpaal-voortgang (1/3/5), rewards
- [x] **`app/(app)/analyse/[id]/page.tsx`** ✅ — ReferralWidget toegevoegd na actiepunten

### Sessie 2026-04-18 (sessie 18) — Analyse flow volledig redesigned

- [x] **Analyse wizard (Stap 1 / Stap 2)** ✅ — `app/(app)/analyse/page.tsx` volledig herschreven:
  - Tab-navigatie: "Nieuwe analyse" + "Eerdere analyses" (haalt assessments op via API)
  - Stap-indicator: visuele Stap 1 → 2 progress
  - Twee grote invoertegels: "Plak tekst" + "Upload bestand" met hover-states
  - Textarea met **oranje border** bij actief typen
  - **Realtime DBA-element detectie**: 10 kernsignalen, kleurcode progress bar, herkend/niet-herkend tags
  - Privacy blok: "Bescherm je privacy" + vermelding 14-dagen dataretentie
  - Bevestigingsscherm (Stap 2): samenvatting van wat gebruiker krijgt, invoer preview
  - **Disclaimer met verplichte checkboxen** (alleen eerste analyse via `localStorage`), daarna overgeslagen
  - Laadscherm: sequentiële stappen met groene vinkjes en spinner
- [x] **Resultaten pagina** ✅ — `app/(app)/analyse/[id]/page.tsx` uitgebreid:
  - **SVG score-cirkels met animatie** (ease-out cubic, 1.1s) in hero + per domein
  - Derde tab "Bouwstenen" naast Compact + Uitgebreid — afzonderlijke kopieer-knop per bouwsteen
  - **Copy-knop** voor volledige draft tekst (Compact + Uitgebreid)
  - **Scenario-aanbevelingen sectie** met drempelwaarde-label (Sterk aanbevolen / Aanbevolen / Optioneel) gebaseerd op risico-niveau
  - Scenario klikken laadt voorbeeldtekst in heranalyse-veld
  - Heranalyse-veld gecombineerd met follow-up vragen en scenario-tekst
- [x] **Dashboard hero banner** ✅ — grote visuele CTA tegel met gradient, logo-icoon, animatie
- [x] **Layout uitloggen** ✅ — rood hover-state (`hover:bg-destructive/10 hover:text-destructive`)

> **Openstaande acties voor Marvin (sessie 18 — push indien nog niet gedaan):**
> ```bash
> rm -f ~/dba-kompas/.git/index.lock ~/dba-kompas/.git/HEAD.lock
> cd ~/dba-kompas
> git add "app/(app)/analyse/page.tsx" "app/(app)/analyse/[id]/page.tsx" "app/(app)/dashboard/page.tsx" "app/(app)/layout.tsx" "docs/TASKS.md" "docs/PROJECT_STATE.md"
> git commit -m "feat(analyse): wizard, realtime detectie, score circles, scenario's en disclaimer"
> git push origin main
> ```
> (Bevat ook de loading screen fix: BrandLogo boven spinner, gecentreerd layout)

### Sessie 2026-04-18 (sessie 17) — App-wide redesign

- [x] **App-wide redesign volledig** ✅ — alle app-pagina's (15 bestanden) herschreven met nieuw design system:
  - Design regels: `rounded-xl border border-border bg-card`, `text-3xl font-bold tracking-tight`, `space-y-8`, empty states `py-16 text-center`
  - Geen shadcn Card, CardHeader, CardTitle, CardDescription, CardContent meer in app-pagina's
  - Bijgewerkt: `dashboard`, `analyse`, `documenten`, `notificaties`, `profiel`, `gidsen`, `gidsen/[slug]`
  - Admin: `admin/page.tsx` + alle sub-pagina's (`gebruikers`, `analyses`, `funnel`, `emails`, `nieuws`)
  - `layout.tsx` + `nieuws/page.tsx` al bijgewerkt in sessie 16
  - Commit: `fcdebe7`
- [x] **Gidsen compacte lijstweergave** ✅ — alleen titel + gradatiebadge per rij, alle categorie-gidsen in één oogopslag zichtbaar

> **Openstaande actie voor Marvin (sessie 17):**
> 1. `rm -f ~/dba-kompas/.git/HEAD.lock` in Mac terminal
> 2. Dan: `cd ~/dba-kompas && git add "app/(app)/gidsen/page.tsx" && git commit -m "refactor(gidsen): compacte lijstweergave" && git push origin main`
> 3. Dit pusht zowel de redesign commit (`fcdebe7`) als de gidsen-fix mee naar Vercel

### Sessie 2026-04-18 (sessie 16) — Nieuws systeem volledig gebouwd + STRIPE-LIVE

- [x] **STRIPE-LIVE** ✅ — live Stripe keys + webhook al actief op Vercel/dbakompas.nl
- [x] **PROD-001 volledig** ✅
  - `lib/news/sources.ts`: RSS bronnen (ZipConomy, Min. SZW, Rijksoverheid, Min. Fin., Min. EZ), trusted domains, DBA/ZZP keywords
  - `lib/news/fetch.ts`: RSS fetch (native, geen externe lib), AI herschrijf via Claude Haiku, SHA-256 dedup, 12-maanden filter, 5-min cooldown, cleanup oude items
  - `app/api/news/refresh/route.ts`: POST (auth+cooldown) + GET (Vercel cron via CRON_SECRET)
  - `app/api/news/read/route.ts`: DB-persistente leesmarkering (vervangt localStorage)
  - `app/(app)/nieuws/page.tsx`: volledig herschreven — impact/thema/bron/ongelezen filters, uitklap-kaarten, feedbackknoppen, bronbetrouwbaarheid-indicator, vernieuwen-knop
  - `app/(app)/admin/nieuws/page.tsx`: admin nieuws-beheerpagina (CRUD)
  - `app/api/admin/nieuws/route.ts`: GET/POST/PATCH/DELETE met admin-check
  - `vercel.json`: cron elk uur voor automatische RSS refresh
  - Admin dashboard: Nieuws-tegel toegevoegd

> **Openstaande acties voor Marvin:**
> 1. SQL uitvoeren in Supabase Studio (New query):
>    ```sql
>    CREATE TABLE public.user_news_read (
>      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
>      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
>      news_item_id uuid NOT NULL REFERENCES public.news_items(id) ON DELETE CASCADE,
>      read_at timestamptz DEFAULT now(),
>      UNIQUE (user_id, news_item_id)
>    );
>    ALTER TABLE public.user_news_read ENABLE ROW LEVEL SECURITY;
>    CREATE POLICY "Users can manage own read status"
>      ON public.user_news_read FOR ALL USING (auth.uid() = user_id);
>    ```
> 2. Eerste RSS refresh handmatig triggeren via admin of /api/news/refresh POST
> 3. `CRON_SECRET` environment variable aanmaken in Vercel (willekeurige string, bijv. `openssl rand -hex 32`)

### Sessie 2026-04-17 (sessie 15) — Gidsen volledig geïmplementeerd

- [x] **PROD-002 fase 1: Gidsen content + rendering** ✅
  - `lib/guides/content.ts`: volledig type-systeem (`GuideBlock` met 6 types, `GuideEntry`, `GuideDifficulty`)
  - 10 diepgaande gidsen: Wet DBA, gezagsverhouding, zelfstandigheid, opdrachtomschrijving, handhaving, BTW, aftrekposten, administratie, opdrachtovereenkomst, pensioen
  - `app/(app)/gidsen/page.tsx`: herschreven met categorie-secties, moeilijkheidsgraad-badges (basis/gevorderd/expert), leestijd, subtitel en hover-animaties
  - `app/(app)/gidsen/[slug]/page.tsx`: rijke rendering — callouts (tip/warning/example/important), tabellen, genummerde lijsten met badges, h2/h3 hiërarchie, tag-cloud in header
- [x] **INFRA-004: Hamburger menu marketing site** ✅
  - `app/(marketing)/page.tsx`: hamburger Menu↔X met framer-motion AnimatePresence
  - Mobile panel: backdrop, nav-links (Features/Prijzen/FAQ), CTAs contextgevoelig (ingelogd of niet)
  - Desktop navigatie volledig ongewijzigd

### Sessie 2026-04-17 (sessie 14) — Sales Funnel tegel + paywall race condition fix
- [x] **CT-002: Sales Funnel als aparte pagina** ✅
  - `/admin/funnel/page.tsx` — volledige funnel: stappen, plan-breakdown, risico-uitkomsten, conversie-samenvatting
  - Admin root: funnelkaart verwijderd, Funnel tegel toegevoegd als 4e tegel
  - Grid responsive: 1 → 2 → 4 kolommen
- [x] **Paywall race condition gefixed** ✅
  - `AuthContext.tsx`: `roleLoading` state toegevoegd aan `fetchRole`
  - `layout.tsx`: wacht nu op `!roleLoading` voor paywall-redirect
  - Root oorzaak: `fetchPlan` en `fetchRole` lopen parallel; als plan eerder terugkwam dan role, was `isAdmin` nog `false` → redirect naar `/upgrade`

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
