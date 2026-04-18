# PROJECT_STATE.md

**Laatste update:** 2026-04-18 (sessie 18 — analyse flow redesign)
**Maturity:** ~100% MVP (live op dbakompas.nl, Stripe LIVE, nieuws systeem, volledig redesign + verbeterde analyse UX)

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

- **SQL migratie**: `user_news_read` tabel aanmaken in Supabase Studio (zie TASKS.md)
- **CRON_SECRET**: env var aanmaken in Vercel (`openssl rand -hex 32`)
- **Eerste RSS refresh**: handmatig triggeren na SQL migratie
- **Loops**: 3 oude journeys nog te verwijderen (laag risico)
- **TEST-005**: maximale invoerlengte (3000+ tekens) nog niet handmatig getest
- **MAIL-001**: info@dbakompas.nl nog niet in Apple Mail
- **TEST-006**: Welkomstmail end-to-end test — blocked op Postmark goedkeuring

---

## SESSIEHISTORIE

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

**Sessie:** 2026-04-18 (sessie 17)
**Laatste commits:**
- `fcdebe7` — `feat(design): app-wide redesign — consistent spacing, typography en card-stijl` (gepusht via Mac terminal vereist)
- Gidsen refactor (compacte lijstweergave) — commit nog aanmaken via Mac terminal

**Openstaande actie voor Marvin:**
```bash
rm -f ~/dba-kompas/.git/HEAD.lock
cd ~/dba-kompas
git add "app/(app)/gidsen/page.tsx"
git commit -m "refactor(gidsen): compacte lijstweergave — alleen titel en gradatie"
git push origin main
```

## VOLGENDE GEPLANDE STAP

**Prioriteit 1 — Operationeel:**
1. **Push commits** via Mac terminal (zie openstaande actie hierboven)
2. **SQL migratie** `user_news_read` uitvoeren in Supabase Studio (staat al klaar in TASKS.md)
3. **CRON_SECRET** env var aanmaken in Vercel (`openssl rand -hex 32`)
4. **Eerste RSS refresh** handmatig triggeren na SQL migratie

**Prioriteit 2 — Groei:**
5. **GROWTH-001**: Referral-engine bouwen (volledig plan in `docs/GROWTHPLAN_UITVOERING.md`)

**Prioriteit 3 — Product kwaliteit:**
6. **INFRA-002**: Admin alerts systeem (`admin_alerts` tabel + e-mail naar Marvin bij events)
7. **PROD-003**: Notificaties als levend systeem (triggers bij analyse, hoog-impact nieuws, betalingsfout)
8. **QUAL-001**: Analyse-ervaring verdiepen (heranalyse met diff, Word-download)
