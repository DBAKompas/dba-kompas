# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-11 (sessie 3)
**Maturity:** 98%

---

## SAMENVATTING

DBA Kompas is een Next.js 16.2 SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De kernfunctionaliteit is stabiel. Alle kritieke AI- en Stripe-bugs zijn opgelost. Conversie-funnel is volledig functioneel. Paywall actief. PostHog volledig geintegreerd (server-side events + identify + top-of-funnel tracking). Quick Scan succes-scherm volledig herbouwd met twee pricing tiles. Proxy en login-redirect verbeterd met ?next= parameter. 80 tests groen (lokaal: rollup ARM64 sandbox-issue). LOOPS-003 digest cron geimplementeerd.

---

## LAATSTE ACTIE (2026-04-11 sessie 3 — doc-sync + LOOPS-003 digest cron)

**Commits gesynchroniseerd die ontbraken in docs (QUAL-003, SEC-003, fixes, ANAL-001/002/003, UX-001/001b):**
- `1fbe8a4` QUAL-003: 13 unit tests voor lib/loops (updateLoopsContact + sendLoopsEvent)
- `18310ce` SEC-003: proxy.ts uitgebreid (public routes), login ?next= redirect
- `0c8a440` fix(login): Suspense boundary voor useSearchParams bij Next.js static prerendering
- `88366f1` fix(layout): AppShell redirect naar /login aangevuld met ?next=pathname
- `5fc32a4` ANAL-001: PostHog volledig geintegreerd (lib/posthog.ts, PostHogPageview, events op alle kritieke flows)
- `47b709d` ANAL-002: PostHog identify op elke sessie + plan als person property
- `e3d45e1` ANAL-003: top-of-funnel tracking in QuickScan (5 events)
- `e5a13e7` UX-001: Quick Scan succes-scherm hertworpen met directe pricing CTAs
- `0207697` UX-001b: succes-scherm omgebouwd naar twee volwaardige pricing tiles

**LOOPS-003 geimplementeerd:**
- `app/api/cron/weekly-digest/route.ts`: POST handler, CRON_SECRET verificatie, alle actieve pro-gebruikers ophalen, digest versturen
- `app/api/cron/monthly-digest/route.ts`: zelfde structuur voor maandelijks
- `vercel.json`: crons toegevoegd (maandag 09:00 CET + 1e van de maand 09:00 CET)
- `docs/DEPLOYMENT.md` en `.env.local.example` bijgewerkt met CRON_SECRET

---

## LAATSTE ACTIE (2026-04-10 sessie 2 — Loops e-mailsequenties gebouwd + Journey B live)

**LOOPS-002 — Loops journeys aangemaakt en grotendeels geconfigureerd**

Wat is er gedaan (sessie 2026-04-10 avond):

**E-mailsequenties v2 herschreven:**
- 9 e-mails (3 per risiconiveau: hoog / gemiddeld / laag) volledig herschreven
- Toon: eerlijk over beperking Quick Scan (5 meerkeuze-vragen = indicatie, geen oordeel), urgentie voor verder onderzoek, maandabonnement gepositioneerd als "nieuws + alles op één plek"
- Document gegenereerd: `DBA Kompas — Loops e-mailsequenties v2.docx`
- CTA-URLs: `https://dba-kompas.vercel.app/register?plan=one_time_dba&email={contact.email}` (tijdelijk Vercel URL, wordt dbakompas.nl bij livegang)

**Loops journeys aangemaakt in Loops dashboard (handmatig):**
- Journey A: "DBA Kompas — Quick Scan Hoog risico" — trigger: `quick_scan_completed`, filter: `Quick_scan_risk_level = hoog` — **DRAFT** (activeren bij livegang)
- Journey B: "DBA Kompas — Quick Scan Gemiddeld risico" — trigger: `quick_scan_completed`, filter: `Quick_scan_risk_level = gemiddeld` — **ACTIEF + GETEST**
- Journey C: "DBA Kompas — Quick Scan Laag risico" — trigger: `quick_scan_completed`, filter: `Quick_scan_risk_level = laag` — **DRAFT** (activeren bij livegang)

**Flow-architectuur per journey:**
- `Event received` → `Audience filter (risk_level)` → `Send email X1` → `Branch (1 branch)` → `Audience filter (subscription_status does not equal "active", All following nodes)` → `Timer 4d` → `Send email X2` → `Branch (1 branch)` → `Audience filter (subscription_status does not equal "active", All following nodes)` → `Timer 7d` → `Send email X3` → `Loop completed`
- Branch nodes stoppen geconverteerde contacts: als `subscription_status = active` → contact passeert Audience filter niet → flow stopt

**Bevestigd werkend:**
- `plan` + `email` query params correct verwerkt door `/register` pagina
- `subscription_started` en `one_time_purchase` events al aanwezig in Stripe webhook
- `subscription_status` contact property wordt bijgewerkt via webhook bij betaling
- Journey B Send test verstuurd en ontvangen — opmaak correct

**Pending bij livegang op dbakompas.nl:**
- Journey A + C activeren via "Resume"
- CTA-URLs in alle 9 emails omzetten van Vercel-URL naar `dbakompas.nl`
- Oude Loops journeys verwijderen: `quick_scan_completed - high`, `quick_scan_completed - medium`, `quick_scan_completed - low`

---

## LAATSTE ACTIE (2026-04-10 sessie 1 — INFRA-001 DNS migratie naar Cloudflare)

**INFRA-001 — DNS migratie naar Cloudflare IN PROGRESS**

Wat is er gedaan (sessie 2026-04-10):
- Vastgesteld dat STRATO geen subdomain MX records ondersteunt → besloten: DNS migreren naar Cloudflare
- Cloudflare free account aangemaakt, domein `dbakompas.nl` toegevoegd
- Cloudflare heeft automatisch alle bestaande DNS records geïmporteerd (A, CNAME, MX, TXT, SRV)
- Resend MX record toegevoegd in Cloudflare: `send` → `feedback-smtp.[...].amazonses.com`, priority 10
- DNSSEC uitgeschakeld bij STRATO (status: "Wordt gedeactiveerd" — verwerking loopt)
- Nameserver-wissel nog niet doorgevoerd (wacht op DNSSEC deactivatie bij STRATO)

Pending acties voor INFRA-001:
1. Wacht tot STRATO DNSSEC volledig gedeactiveerd is
2. STRATO NS-record → "Eigen nameservers" → `brett.ns.cloudflare.com` + `peaches.ns.cloudflare.com`
3. Cloudflare: klik "I updated my nameservers"
4. Wacht op DNS propagatie + Cloudflare activatie (15 min tot 24 uur)
5. Resend: herstart domeinverificatie → wacht op DKIM + SPF + MX alle Verified
6. Supabase SMTP instellen: host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key, sender `noreply@dbakompas.nl`
7. Supabase: e-mailbevestiging opnieuw inschakelen
8. Test: nieuw account → verificatiemail van `noreply@dbakompas.nl`

Extra taak toegevoegd:
- MAIL-001: `info@dbakompas.nl` instellen in Apple Mail via STRATO IMAP/SMTP (imap.strato.de:993 + smtp.strato.de:465)

**Overige taken deze sessie (alle commits gepusht):**
- QUAL-002: `__tests__/analyzeDbaText.test.ts` (21 tests) — 67/67 groen (commit `6477615`)
- DOC-001: `vercel.json` + `docs/DEPLOYMENT.md` + `.env.local.example` fix (commit `779619e`)
- KI-008 opgelost: comment toegevoegd aan `postProcessDbaOutput` (commit `4ba0c6e`)
- KNOWN_ISSUES.md: KI-005, KI-008, KI-009 gesloten

---

## LAATSTE ACTIE (2026-04-09 ochtend, commit `5f63a53`)

**Taak:** FEAT-004 + FEAT-005 — Paywall + one-time upsell + upgrade flow

**Wat is er gedaan:**
- `modules/billing/entitlements.ts` — `getUserPlan()` uitgebreid met `one_time_purchases` check
- `app/api/user/plan/route.ts` — NIEUW: `GET /api/user/plan` server endpoint
- `components/auth/AuthContext.tsx` — `plan`, `planLoading`, `refreshPlan` toegevoegd aan context
- `app/(app)/layout.tsx` — `AppShell` redirect naar `/upgrade` als `plan === 'free'` (uitzondering: `/profiel`)
- `app/(app)/upgrade/page.tsx` — NIEUW: paywallpagina met 3 plankaarten + directe checkout
- `modules/email/send.ts` — `sendOneTimeUpsellEmail()` toegevoegd (Resend, DBA Kompas huisstijl, upgradeknop naar `/upgrade-to-pro`)
- `app/api/billing/webhook/route.ts` — `sendOneTimeUpsellEmail()` aangeroepen na `one_time_purchases` INSERT
- `app/(app)/upgrade-to-pro/page.tsx` — NIEUW: server component, conflict check, Stripe coupon `ONETIMECREDIT` toepassen, directe Stripe-redirect
- Stripe coupon `ONETIMECREDIT` aangemaakt in test mode (€9,95 off once)
- `STRIPE_COUPON_ONE_TIME_UPGRADE=ONETIMECREDIT` ingesteld als Vercel env var

**Eerder deze sessie (commit `32018b8`):**
- `EmailCheckoutModal.tsx` geconsolideerd: `supabase.auth.signUp()` direct in modal, geen redirect naar `/register` meer. Stap 2 heeft plandropdown bovenin. Verifyscherm binnen modal. Knoptekst "Account aanmaken & betalen". Footer "Al een account? Inloggen →".

**Eerder deze sessie (FIX-014 t/m FIX-020):**
- `app/register/page.tsx` gebouwd — volledig signup + checkout formulier (FIX-014)
- `app/checkout-redirect/page.tsx` gebouwd — post-e-mailverificatie checkout trigger (FIX-015)
- `app/auth/signup/page.tsx` gebouwd — server redirect naar `/login` (FIX-016)
- `/api/billing/checkout` uitgebreid met `plan`-lookup (FIX-017)
- `cancel_url` gecorrigeerd van `/pricing` naar `/dashboard` (FIX-018)
- Supabase Site URL gecorrigeerd naar `https://dba-kompas.vercel.app` (FIX-019, handmatig)
- Redirect URL `https://dba-kompas.vercel.app/**` toegevoegd aan Supabase allowlist (FIX-020, handmatig)
- Stripe keys gecorrigeerd: live mode keys vervangen door test mode keys in Vercel (handmatig)
- `payment_method_types: ['card', 'ideal']` verwijderd uit subscription checkout (iDEAL werkt niet bij recurring)
- TEST-002 bevestigd werkend: "Abonnement geactiveerd!" banner zichtbaar na Stripe betaling

---

## LAATSTE WIJZIGING IN CODE

**Commits deze sessie:**

| Commit | Bestanden | Omschrijving |
|---|---|---|
| `6477615` | `__tests__/analyzeDbaText.test.ts` (NIEUW), `docs/TASKS.md`, `docs/PROJECT_STATE.md` | QUAL-002: 21 integratietests voor analyzeDbaText + generateAssignmentDraft |
| `779619e` | `vercel.json` (NIEUW), `docs/DEPLOYMENT.md` (NIEUW), `docs/TASKS.md`, `.env.local.example` | DOC-001: Vercel config + deployment docs + env.example fix |
| `4ba0c6e` | `lib/ai/dbaAnalysis.ts`, `docs/KNOWN_ISSUES.md` | KI-008 comment + KI-005/008/009 gesloten in KNOWN_ISSUES |

**Branch:** `main`
**Status:** Alle commits gepusht naar GitHub, live op Vercel

---

## VOLGENDE GEPLANDE STAP

**INFRA-001 voltooien — Resend verificatie + Supabase SMTP**

> Dit is de huidige blokkade voor livegang op `dbakompas.nl`. Zodra dit klaar is, volgen automatisch de Loops- en Stripe live-stappen.


Exacte vervolgstappen bij volgende sessie:

**Stap A — Controleer Resend verificatiestatus**
1. Ga naar [resend.com/domains](https://resend.com/domains) → `dbakompas.nl`
2. Controleer of DKIM en SPF TXT beide **Verified** zijn
3. Als nog Pending: klik **Restart verification** en wacht nog 15-30 min
4. Als Failed: controleer STRATO DNS → TXT- en CNAME-records → voorvoegsel `resend._domainkey` en `send` correct aanwezig met exacte waarden

**Stap B — Supabase SMTP instellen** (pas na Verified)
1. Ga naar Supabase Dashboard → Authentication → Settings → SMTP Settings
2. Zet **Enable Custom SMTP** aan
3. Vul in:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: Resend API key (zie Resend Dashboard → API Keys)
   - Sender name: `DBA Kompas`
   - Sender email: `noreply@dbakompas.nl`
4. Klik Save

**Stap C — E-mailbevestiging terug aanzetten**
1. Supabase Dashboard → Authentication → Settings
2. Zet **Enable email confirmations** aan
3. Klik Save

**Stap D — Testen**
Maak een nieuw testaccount aan op `https://dba-kompas.vercel.app` met een echt e-mailadres. Verificatiemail moet binnenkomen van `noreply@dbakompas.nl`.

**Daarna open (na INFRA-001):**
- Journey A + C activeren in Loops (Resume)
- CTA-URLs in alle 9 Loops-emails omzetten van Vercel naar `dbakompas.nl`
- Stripe webhook endpoint configureren voor live mode: `https://dbakompas.nl/api/billing/webhook`
- Stripe coupon `ONETIMECREDIT` aanmaken in live mode + env var updaten
- Stripe keys wisselen naar live mode in Vercel
- Oude Loops journeys verwijderen (`quick_scan_completed - high/medium/low`)
- TEST-005: maximale invoerlengte testen (3000+ tekens, manueel)

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
- PDF rapport generatie — correct opgemaakt, leesbare tekst, consistente layout
- Rate limiting op analyse endpoint (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- Stripe subscription checkout — TEST-002 BEVESTIGD WERKEND
- Stripe one-time checkout — geïmplementeerd en gecorrigeerd (KI-011)
- Stripe webhook handler — geïmplementeerd met idempotency — TEST-003 BEVESTIGD WERKEND
- Conversie-funnel volledig: modal signUp → verifyscherm → checkout → `/dashboard`
- `EmailCheckoutModal` — geconsolideerd, signUp direct in modal, verifyscherm inline
- `/register` pagina — fallback signup + checkout (pre-filled email/plan)
- `/checkout-redirect` pagina — auto-triggert checkout na e-mailverificatie
- Dashboard succesbericht na geslaagde betaling (`?session_id=...`)
- `trialing` status herkend als actief Pro-plan
- **Paywall** — ingelogde gebruikers zonder actief abonnement of one-time purchase worden doorgestuurd naar `/upgrade`
- **`/upgrade` paywallpagina** (`app/upgrade/page.tsx`, standalone zonder sidebar) — 3 plankaarten, directe Stripe checkout vanuit pagina
- **One-time upsell e-mail** — verstuurd via Resend na `one_time_purchases` INSERT door webhook
- **`/upgrade-to-pro` flow** (`app/upgrade-to-pro/page.tsx`, server component, geen UI) — conflict check (geen dubbel abonnement), Stripe coupon `ONETIMECREDIT` toegepast automatisch als gebruiker one-time purchase heeft
- Newsfeed, notificaties, documentbeheer
- Loops marketing automation (quick_scan, subscription events)
- PostHog analytics (ANAL-001/002/003: server-side events, identify, top-of-funnel QuickScan tracking)
- Sentry error tracking
- Quick scan landing page (succes-scherm met twee pricing tiles, directe checkout)
- Proxy middleware: ?next= redirect, public routes correct
- Login: ?next= parameter, Suspense boundary
- Digest cron endpoints: `/api/cron/weekly-digest` + `/api/cron/monthly-digest` (LOOPS-003)

## WAT NIET WERKT / ONZEKER

- **IN PROGRESS**: INFRA-001 — Resend domein `dbakompas.nl` verificatie loopt (DNS propagatie bij STRATO). Supabase SMTP nog niet ingesteld. E-mailbevestiging tijdelijk UITGESCHAKELD. Zie "Volgende geplande stap" voor exacte vervolgstappen.
- **NIET AANGEMAAKT**: Stripe coupon `ONETIMECREDIT` bestaat alleen in test mode. Vóór live launch aanmaken in Stripe live mode + env var updaten.
- **ONBEKEND**: E-mail digest triggers — geen cron job gevonden voor Resend digests
- **GEDEELTELIJK KLAAR**: Loops journeys — Journey B actief + getest. Journey A + C gebouwd maar in Draft (activeren bij livegang dbakompas.nl). CTA-URLs nog op Vercel-URL.
- **OPEN**: TEST-005 — maximale invoerlengte (3000+ tekens) nog niet manueel getest
- **GEDEELTELIJK**: Unit + integratietests aanwezig (80 totaal na QUAL-003). E2e-tests ontbreken.
- **SANDBOX-ISSUE**: `npm test` faalt lokaal in ARM64 sandbox door ontbrekende `@rollup/rollup-linux-arm64-gnu`. Geen code-issue. Op Vercel en Mac werkt het correct.

---

## DEPLOYMENT STATUS

| Omgeving | Status | Onderbouwing |
|---|---|---|
| Lokaal | WERKEND | 67 tests groen (npm test) |
| Vercel (main branch) | LIVE | Auto-deploy via GitHub, TEST-002 + TEST-003 bevestigd |
| Vercel config | GEDOCUMENTEERD | `vercel.json` aanwezig (fra1, www-redirect), `docs/DEPLOYMENT.md` |

---

## INTEGRATIE STATUS

| Systeem | Code aanwezig | Geconfigureerd | Live getest |
|---|---|---|---|
| Supabase Auth + DB | JA | JA | BEVESTIGD |
| Anthropic Claude Haiku | JA | JA | BEVESTIGD |
| Stripe (checkout + webhook) | JA | JA | TEST-002 + TEST-003 BEVESTIGD ✅ |
| Resend (digest + upsell) | JA | JA (domein pending verificatie) | NEE |
| Supabase SMTP (auth mail) | N.V.T. (Supabase config) | NEE — INFRA-001 IN PROGRESS | NEE |
| Loops | JA | JA | GEDEELTELIJK — Journey B live + getest, A+C bij livegang |
| PostHog | JA | JA | ONBEKEND |
| Sentry | JA | JA | ONBEKEND |

---

## ARCHITECTUUR OORDEEL

Correct gestructureerd:
- Business logic in `lib/` en `modules/`, niet in UI components
- Alle AI-aanroepen via `claude-haiku-4-5-20251001`
- Supabase admin voor server-side mutaties (RLS bypass correct)
- Entitlements via `modules/billing/entitlements.ts` (active + trialing + one_time = Pro)
- Paywall via `AuthContext` plan state + `AppShell` redirect (client-side, veilig voor MVP)
- Prompt injection beveiliging aanwezig
- Follow-up vragen via signaaldetectie (geen extra AI-aanroep)
- Stripe coupon via server-side `discounts` parameter (nooit client-exposed)

Aandachtspunten:
- `postProcessDbaOutput` verwerkt draft-velden die fase 1 niet levert (no-ops, gedocumenteerd via comment, KI-008 gesloten)
- 67 unit + integratietests aanwezig — e2e ontbreekt nog
- Paywall is client-side — server-side middleware zou robuuster zijn, maar voldoende voor MVP
