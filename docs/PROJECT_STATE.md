# PROJECT_STATE.md

**Laatste update:** 2026-04-23 (sessie 24 — Secret-rotatie-sprint: Sentry DSN + Stripe secret keys + Stripe webhook secret volledig geroteerd en geverifieerd; Supabase key-migratie-plan opgeleverd voor review)
**Maturity:** ~100% MVP + conversie-geoptimaliseerde koopflow (guest-email checkout, click-through activatie, magic-link fallback)

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
- **INFRA-004 AFGEROND**: hamburger menu marketing site (framer-motion, backdrop, contextgevoelige CTAs)
- Vercel Cron Jobs (weekly/monthly digest triggers)
- Quick scan funnel volledig meetbaar (Supabase + Loops)
- **Gidsen volledig geïmplementeerd**: 10 diepgaande gidsen, rijk type-systeem, gestijlde callouts + tabellen
- **KI-020 guest-email checkout live**: bezoeker geeft alleen e-mail op, wordt direct naar Stripe gestuurd, user-provisioning via webhook na betaling
- **KI-020-A activatie-flow live**: welkomstmail leidt naar eigen-domein click-through pagina's (`/auth/activate/<token>` primair + `/auth/welcome/<token>` magic-link fallback), stateful `welcome_tokens`-tabel met HMAC-signed tokens, 24u TTL
- **TEST-006 pre-flight compleet**: Postmark approved + smoke test, live Stripe webhook actief, alle env vars productie, `WELCOME_TOKEN_SECRET` gezet, migration 006_welcome_tokens uitgevoerd

**Status e-mailinfrastructuur:** Postmark volledig operationeel. DKIM + Return-Path geverifieerd, `POSTMARK_SERVER_TOKEN` in Vercel, Supabase SMTP bijgewerkt. Resend volledig verwijderd. Welkomstmail-templates (`welkomstmail-eenmalig | -maand | -jaar`) ondersteunen `{{ activate_link }}` (primaire CTA) en `{{ login_link }}` (secundaire magic-link).

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
- Quota systeem (KI-021): monthly 20/mnd, yearly 25/mnd, one_time 1 totaal, free 0. Reset op de 1e van de kalendermaand. Atomic Postgres RPC `increment_usage_if_under_quota` voor race-safe tellen, `release_usage_reservation` als compensating transaction bij AI-fouten. UsageMeter op dashboard toont huidig verbruik.
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
- **Gidsen** (`/gidsen` + `/gidsen/[slug]`): 10 diepgaande gidsen, categorie-secties, moeilijkheidsgraad-badges, callouts, tabellen ✅
- **Mobiel hamburger menu** op marketing site (`app/(marketing)/page.tsx`) ✅
- **Stripe LIVE mode**: live keys + webhook actief op Vercel + dbakompas.nl ✅
- **Nieuws systeem volledig** ✅
  - RSS feed fetcher (5 bronnen, native XML parser, geen externe lib)
  - Claude Haiku AI herschrijf per artikel
  - SHA-256 deduplicatie, 12-maanden filter, 5-minuten cooldown
  - Vercel cron elk uur
  - Admin CRUD UI (`/admin/nieuws`)
  - Gebruikerspagina met impact/thema/bron-filters, ongelezen-tracking, feedback
  - DB-persistente leesmarkering (`user_news_read` tabel — migratie pending)
- **App-wide redesign volledig** ✅ (sessie 17)
  - 15 app-pagina's herschreven: `dashboard`, `analyse`, `documenten`, `notificaties`, `profiel`, `nieuws`, `gidsen`, `gidsen/[slug]`, `admin` + 5 admin sub-pagina's
  - Design system: `rounded-xl border border-border bg-card`, `text-3xl font-bold tracking-tight`, `space-y-8`
  - Geen shadcn Card components meer in app-pagina's
  - Gidsen: compacte lijstweergave (alleen titel + gradatiebadge, alles in één oogopslag)
  - Commit `fcdebe7` aangemaakt — push pending (zie openstaande actie TASKS.md)

## WAT NIET WERKT / PENDING

- **Postmark templates handmatig aanpassen**: drie aliases (`welkomstmail-eenmalig | -maand | -jaar`) moeten `{{ activate_link }}`-CTA + `{{ login_link }}`-fallback krijgen met DBA-huisstijl + logo (pending Marvin)
- **TEST-006 B1/B2/B3 retest**: na templates-update drie live betalingen uitvoeren en activate + magic-link paden valideren in `docs/TEST_006_RESULTS.md`
- **SQL migratie `user_news_read`**: nog steeds pending (zie TASKS.md, aparte track)
- **CRON_SECRET**: env var aanmaken in Vercel (`openssl rand -hex 32`)
- **Eerste RSS refresh**: handmatig triggeren na SQL migratie
- **Loops**: 3 oude journeys nog te verwijderen (laag risico)
- **TEST-005**: maximale invoerlengte (3000+ tekens) nog niet handmatig getest
- **MAIL-001**: info@dbakompas.nl nog niet in Apple Mail

---

## SESSIEHISTORIE

### Sessie 2026-04-23 (sessie 24) — Secret-rotatie-sprint + Supabase migratie-plan

**Context:** Brede audit op uitgelekte of verouderde productie-secrets. Drie sporen parallel: Sentry DSN, Stripe API keys + webhook secret, en voorbereiding Supabase keys-migratie.

**Opgeleverd:**

*Sentry DSN rotatie:*
- Nieuwe DSN gegenereerd in Sentry project `javascript-nextjs` (= DBA Kompas), oude default-key disabled (niet verwijderd).
- `SENTRY_DSN` in Vercel bijgewerkt (Sensitive, Production + Preview), redeploy zonder cache. Geen `NEXT_PUBLIC_SENTRY_DSN` aangemaakt, conform huidige `sentry.client.config.ts` setup.
- Diagnose: Sentry SDK is niet volledig geactiveerd onder Next.js 16 + `@sentry/nextjs 10.47.0`. Vereist `withSentryConfig`-wrapper in `next.config.ts` + `instrumentation.ts` + `instrumentation-client.ts`. Op backlog P1. Smoke-test geparkeerd tot SDK volledig verbonden is.

*Stripe secret keys:*
- `sk_live_...1ft7` (default template-key, nooit gebruikt) → Expired in Stripe.
- `sk_live_...xndF` (SaaS Starter, Apr 4) → Expired na verificatie.
- `sk_live_...g7dc` (DBA Kompas Live, Apr 23) → nieuwe productie-key, `STRIPE_SECRET_KEY` in Vercel bijgewerkt.
- Verificatie-methode: `/upgrade-to-pro`-knop getriggerd om `stripe.checkout.sessions.create()` te activeren. Stripe Checkout-pagina laadde (`cs_live_...`), `Last used` op `g7dc` sprong naar 2026-04-23, `xndF` bleef op 2026-04-20. Bewijs dat Vercel productie op `g7dc` draait.

*Stripe webhook secret:*
- Oude signing secret eindigend op `...qcyP` vervangen door nieuwe `whsec_...4w5W9` via Stripe Webhooks → endpoint `dbakompas.nl/api/billing/webhook` → Roll.
- `STRIPE_WEBHOOK_SECRET` in Vercel bijgewerkt.
- Verificatie: Resend op eerder event `checkout.session.completed` (Apr 20) in Stripe Workbench. Nieuwe delivery 2026-04-23 09:54:03 CEST, HTTP 200, response `{"received": true, "deduplicated": true}`. Signature-validatie slaagt tegen nieuwe secret, idempotency-laag werkt correct op Event-ID.

*Supabase key-migratie (gepland, nog niet uitgevoerd):*
- Ontdekking: Supabase is gemigreerd naar nieuw keys-model (ECC P-256 JWT signing + `sb_publishable_` / `sb_secret_` API-keys). Klassieke "regenerate JWT secret"-flow niet meer beschikbaar. `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `SUPABASE_SERVICE_ROLE_KEY` staan nog op legacy-keys.
- `docs/IMPLEMENTATIE_PLAN_SUPABASE_KEY_MIGRATION.md` opgeleverd: 4-fasen-plan (code + env vars + redeploy → 24h wait → disable legacy keys → cleanup → documentatie). Bevestigd via Supabase docs dat `sb_publishable_` / `sb_secret_` drop-in replacements zijn, RLS-policies met `auth.role() = 'service_role'` blijven werken zonder refactor.
- Uitvoering Fase 1 gaat in een verse sessie op een schone git-branch, niet hier.

*Productie-logs backlog (bycatch uit verificatie):*
- `/api/admin/gebruikers` retourneert herhaaldelijk HTTP 500 met `column profiles.plan does not exist`. Schema-mismatch tussen query en productie-DB.
- `/api/admin/alerts` retourneert HTTP 401. Auth-laag probleem.
- `/api/billing/portal` geeft functioneel correcte HTTP 404 `No subscription found` voor gebruikers zonder Stripe-customer, maar UI toont geen user-feedback (knop "Abonnement beheren" faalt stil).

**Openstaand voor sessie 25+:**
1. Review `docs/IMPLEMENTATIE_PLAN_SUPABASE_KEY_MIGRATION.md` §11 en uitvoering Fase 1.
2. Sentry SDK volledig activeren onder Next.js 16 (`withSentryConfig` + `instrumentation.ts` + `instrumentation-client.ts`). Daarna echte error-smoke-test op nieuwe DSN.
3. Backlog-bugs admin-gebruikers-schema, admin-alerts-401 en billing-portal-UI-feedback triage.

### Sessie 2026-04-22 (sessie 23) — KI-022 OPGELOST, mail end-to-end gevalideerd

- INFRA-002 triggers live + migratie 008 in Supabase.
- KI-022 periodic mail-worker op Vercel Hobby geblokkeerd (4e cron), opgelost via GitHub Actions workflow `.github/workflows/pending-alerts.yml` die elke 10 min curlt naar `/api/cron/pending-alerts` met `Authorization: Bearer $CRON_SECRET`.
- Eindvalidatie: workflow run #8 → HTTP 200 `{"processed":1,"mailed":1,"mailFailed":0,"durationMs":1264}`. Supabase `email_sent = true` bevestigd op testrij. Mail fysiek ontvangen in `marvin.zoetemelk@icloud.com`.

### Sessie 2026-04-20 (sessie 20) — KI-020 guest-checkout + KI-020-A activatie-flow

**Context:** Sessie 19 introduceerde KI-020 (guest-email checkout). Bij TEST-006 bleek Gmail's SafeBrowsing-prefetcher rauwe Supabase-magic-links te consumeren vóór de klant kon klikken, waardoor `otp_expired` optrad. Amendement KI-020-A verplaatst de click-through naar eigen domein.

**Opgeleverd:**
- `lib/auth/welcome-token.ts` + `lib/auth/welcome-token-server.ts`: HMAC-SHA256 stateless signer + DB-state wrapper (issue/validate/markUsed)
- `supabase/migrations/006_welcome_tokens.sql`: `public.welcome_tokens` (jti PK, user_id, email, created_at, expires_at, used_at, used_ip, used_purpose, revoked_at, revoke_reason), RLS aan, alleen service-role toegang, migratie uitgevoerd in Studio
- `app/auth/activate/[token]/{page.tsx,ActivateForm.tsx,actions.ts,types.ts}`: wachtwoord-instel flow met policy (min 10 + upper/lower/digit/special), server action met `redirect('/dashboard')`
- `app/auth/welcome/[token]/{page.tsx,WelcomeForm.tsx,actions.ts}`: magic-link-fallback, POST-only genereert verse Supabase-magic-link
- `lib/auth/provision-user.ts`: returnt nu `{userId, activateUrl, loginUrl, isNew}`, beide delen hetzelfde token
- `modules/email/send.ts`: accepteert `{activateLink, loginLink}` → Postmark `TemplateModel.activate_link` + `login_link`
- `app/api/billing/webhook/route.ts`: gebruikt `result.activateUrl` en `result.loginUrl`
- `app/login/page.tsx`: banner + auto-switch naar magic-mode bij `?error=auth_callback_error` of `#error_code=otp_expired` (hash-cleanup via `history.replaceState`)
- `__tests__/welcomeToken.test.ts` (11) + `__tests__/provisionUser.test.ts` (8): allen groen
- `docs/DECISIONS.md`: uitgebreide KI-020-A entry met rationale, mechanisme, security, observability
- Env `WELCOME_TOKEN_SECRET` in Vercel (alle environments)

**Build-fix:** `'use server'`-bestanden mogen onder Next.js 16 / React 19 alleen async functies exporteren. `PASSWORD_MIN_LENGTH` gedegradeerd naar interne const; `ActivateActionState` verplaatst naar losse `types.ts`. Vercel-deploy groen na commit `e77f9e7`.

**Openstaand:** Postmark-templates (handmatig) + TEST-006 B1/B2/B3 end-to-end live retest.

### Sessie 2026-04-18 (sessie 18) — Analyse flow redesign (kern van de app)

- **Analyse wizard volledig herbouwd** ✅
  - Tab-navigatie: Nieuwe analyse / Eerdere analyses
  - Twee invoertegels (Plak tekst / Upload bestand) met hover-states
  - Stap 1 / Stap 2 indicator
  - Textarea met **oranje border** bij actief typen
  - **Realtime DBA-element detectie**: 10 kernsignalen, kleurgecodeerde progress bar, herkende/onherkende tags
  - Privacy block: 14-dagen dataretentie vermeld
  - Bevestigingsscherm: overzicht van wat gebruiker krijgt
  - **Disclaimer met verplichte checkboxen** (alleen eerste analyse, localStorage-vlag)
  - Laadscherm: sequentiële stappen met groene vinkjes
- **Resultaten pagina uitgebreid** ✅
  - SVG score-cirkels met ease-out animatie in hero + per domein
  - Derde tab "Bouwstenen": individuele secties met eigen kopieer-knop
  - Copy-knop voor volledige draft
  - Scenario-aanbevelingen sectie met drempelwaarde-labels (Sterk aanbevolen / Aanbevolen / Optioneel)
  - Scenario klikken → voorbeeldtekst in heranalyse-veld
- **Dashboard hero banner** ✅ — grote gradient CTA tegel
- **Layout uitloggen** ✅ — rood hover-state

### Sessie 2026-04-18 (sessie 17) — App-wide redesign

- **App-wide redesign** ✅: 15 pagina's volledig herschreven met consistent design system
  - `app/(app)/dashboard/page.tsx`, `analyse/`, `documenten/`, `notificaties/`, `profiel/`
  - `app/(app)/gidsen/page.tsx` + `gidsen/[slug]/page.tsx`
  - `app/(app)/admin/page.tsx` + `admin/gebruikers/`, `admin/analyses/`, `admin/funnel/`, `admin/emails/`, `admin/nieuws/`
  - Design regels: `rounded-xl border border-border bg-card p-5/p-6`, `text-3xl font-bold tracking-tight`, `space-y-8`, empty states `py-16 text-center`
  - Admin tabellen: `rounded-xl border overflow-hidden` met padded header en `divide-y`
- **Gidsen compacte lijstweergave** ✅: compacte rijen (titel + gradatiebadge), categorieheaders klein uppercase

### Sessie 2026-04-18 (sessie 16) — Nieuws systeem + STRIPE-LIVE

- **STRIPE-LIVE bevestigd**: live keys + webhook al actief in Vercel/dbakompas.nl ✅
- **PROD-001 nieuws systeem volledig gebouwd**:
  - `lib/news/sources.ts`: 5 RSS bronnen, trusted domains whitelist, DBA/ZZP keywords
  - `lib/news/fetch.ts`: RSS fetch (native), AI herschrijf (Claude Haiku), dedup, cooldown, cleanup
  - `app/api/news/refresh/route.ts`: POST (auth+cooldown) + GET (Vercel cron via CRON_SECRET)
  - `app/api/news/read/route.ts`: DB-persistente leesmarkering
  - `app/api/admin/nieuws/route.ts`: admin CRUD (GET/POST/PATCH/DELETE)
  - `app/(app)/admin/nieuws/page.tsx`: admin nieuws-beheerpagina
  - `app/(app)/nieuws/page.tsx`: volledig herschreven met thema/impact/bron-filters
  - `vercel.json`: cron elk uur toegevoegd

### Sessie 2026-04-17 (sessies 14+15) — Mobiel menu + gidsen

- **INFRA-004 AFGEROND**: hamburger menu marketing site ✅
  - `app/(marketing)/page.tsx`: Menu↔X framer-motion AnimatePresence, backdrop, nav-links, CTAs
- **Sales Funnel tegel + paywall race condition fix** ✅
  - `/admin/funnel/page.tsx`: conversie per stap, plan-breakdown, risico-uitkomsten
  - `AuthContext.tsx` + `layout.tsx`: `roleLoading` state, race condition opgelost
- **PROD-002 fase 1: Gidsen volledig geïmplementeerd** ✅
  - `lib/guides/content.ts`: GuideBlock type-systeem + 10 diepgaande gidsen
  - `app/(app)/gidsen/page.tsx`: categorie-secties, moeilijkheidsgraad + leestijdbadges
  - `app/(app)/gidsen/[slug]/page.tsx`: callouts (4 varianten), tabellen, genummerde lijsten, tags

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

**Sessie:** 2026-04-23 (sessie 24 — Secret-rotatie-sprint)

**Afgeronde rotaties deze sessie:**
1. **Sentry DSN**: nieuwe key actief in Vercel (`SENTRY_DSN` Sensitive, Prod + Preview, redeploy no-cache), oude default-key disabled in Sentry.
2. **Stripe secret keys**: `sk_live_...1ft7` en `sk_live_...xndF` Expired. Nieuwe `sk_live_...g7dc` (DBA Kompas Live) actief. Verificatie via `/upgrade-to-pro` → Stripe Checkout load + `Last used`-beweging op `g7dc`.
3. **Stripe webhook secret**: `...qcyP` vervangen door `whsec_...4w5W9`. Verificatie via Resend op historisch event → HTTP 200, response `{"received": true, "deduplicated": true}`.

**Opgeleverd deze sessie:**
- `docs/IMPLEMENTATIE_PLAN_SUPABASE_KEY_MIGRATION.md` (4-fasen-plan, klaar voor review §11).
- Productie-bycatch-bugs genoteerd op backlog (admin/gebruikers-500, admin/alerts-401, billing/portal-UI-feedback).

**Openstaande acties voor Marvin (sessie 25+):**
1. Review `docs/IMPLEMENTATIE_PLAN_SUPABASE_KEY_MIGRATION.md` §11 (checklist) en Fase 1 uitvoeren in verse sessie met schone git-branch.
2. Sentry SDK volledig activeren (withSentryConfig + instrumentation.ts + instrumentation-client.ts), daarna echte error-smoke-test op nieuwe DSN.
3. Rooktest admin-alert-triggers 1/3/4 (trigger 2 is in sessie 23 groen gevalideerd).
4. Postmark-templates `welkomstmail-eenmalig | -maand | -jaar` handmatig aanpassen: primaire CTA `{{ activate_link }}`, secundaire `{{ login_link }}`.
5. TEST-006 B1/B2/B3 live retest (guest-e-mail → Stripe → welkomstmail → activate of magic-link → dashboard).

## VOLGENDE GEPLANDE STAP

**Prioriteit 1 — Supabase key-migratie Fase 1 (verse sessie):**
1. Review plan §11. Schone git-branch `feat/supabase-keys-migration`. Codewijzigingen in `lib/supabase/{client,server,admin}.ts` + helpers + env-vars.
2. Vercel env-vars toevoegen (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), redeploy, smoke-tests (admin, analyse, checkout, webhook, cron).
3. Pas na 24h succesvol draaien: Fase 2 (disable legacy keys) + Fase 3 (cleanup oude Vercel-vars) + Fase 4 (docs).

**Prioriteit 2 — Afronding Sentry-activatie:**
4. `withSentryConfig`-wrapper in `next.config.ts`, `instrumentation.ts` + `instrumentation-client.ts` toevoegen conform `@sentry/nextjs 10.x` + Next.js 16-guide. Echte throw uitvoeren na deploy en bevestigen dat het event in Sentry landt.

**Prioriteit 3 — Afronding TEST-006:**
5. Postmark-templates bijwerken + TEST-006 B1/B2/B3 live test.

**Prioriteit 4 — Operationele backlog:**
6. SQL migratie `user_news_read` in Supabase Studio.
7. Eerste RSS refresh handmatig triggeren.
8. Admin-rooktests 1/3/4.

**Prioriteit 5 — Bycatch backlog uit productie-logs sessie 24:**
9. `/api/admin/gebruikers` HTTP 500: kolom `profiles.plan` bestaat niet in productie-schema. Of query aanpassen, of migratie toevoegen.
10. `/api/admin/alerts` HTTP 401: auth-laag inspectie.
11. `/api/billing/portal` UI-feedback: wanneer endpoint 404 `No subscription found` retourneert, tonen als nette melding in profielpagina i.p.v. stille failure.

**Prioriteit 6 — Groei & kwaliteit:**
12. **PROD-003**: Notificaties als levend systeem (triggers bij analyse, hoog-impact nieuws, betalingsfout).
13. **QUAL-001**: Analyse-ervaring verdiepen (heranalyse met diff, Word-download).
