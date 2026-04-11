# TASKS.md
**Laatst bijgewerkt:** 2026-04-11 (sessie 3)

---

## TODO

### HOOG (stabiliteit)

- [x] **TEST-002**: Stripe betalingsflow live getest in test mode ✓ (2026-04-09)
  - Checkout API werkte niet: live mode Stripe key + test mode price IDs → mismatch opgelost
  - `payment_method_types: ['card', 'ideal']` verwijderd uit subscription checkout (iDEAL werkt niet voor recurring)
  - Supabase e-mailbevestiging tijdelijk uitgeschakeld om rate limit te omzeilen
  - Resultaat: "Abonnement geactiveerd!" banner zichtbaar op dashboard na Stripe betaling

- [x] **FEAT-004**: Paywall geïmplementeerd (commit `5f63a53`)
  - `getUserPlan()` checkt ook `one_time_purchases`
  - `GET /api/user/plan` endpoint
  - `AuthContext` uitgebreid met `plan`, `planLoading`, `refreshPlan`
  - `AppShell` redirect naar `/upgrade` als plan=free
  - `/upgrade` paywallpagina met 3 plankaarten + directe checkout

- [x] **FEAT-005**: One-time upsell e-mail + upgrade flow (commit `5f63a53`)
  - `sendOneTimeUpsellEmail()` via Resend na one-time checkout
  - `/upgrade-to-pro` server component: conflictcheck, coupon toepassen, Stripe redirect
  - Stripe coupon `ONETIMECREDIT` aangemaakt (€9,95 off once, test mode)
  - `STRIPE_COUPON_ONE_TIME_UPGRADE=ONETIMECREDIT` in Vercel env vars

- [x] **TEST-003**: Stripe webhook delivery bevestigd werkend ✓ (2026-04-09)
  - Stripe Dashboard webhook `dba-kompas-vercel-test` geconfigureerd
  - `STRIPE_WEBHOOK_SECRET` ingesteld in Vercel
  - Echte checkout (info@dbakompas.nl) uitgevoerd met testkaart `4242 4242 4242 4242`
  - `billing_events`: `checkout.session.completed` + `invoice.paid` ontvangen ✅
  - `subscriptions`: rij aangemaakt met `status = active` ✅
  - `profiles`: gebruiker correct opgeslagen ✅
- [ ] **TEST-005**: Edge case — maximale invoerlengte testen (3000+ tekens)

### MIDDEL (kwaliteit)

- [x] **QUAL-001**: Unit tests toegevoegd voor `validateDbaEngineOutput`, `validateDbaInput` ✓ (2026-04-09)
  - `__tests__/validateDbaInput.test.ts` — 18 tests: countWords, detectSignals, validateDbaInput, buildFollowUpQuestions
  - `__tests__/validateDbaEngineOutput.test.ts` — 22 tests: validateDbaEngineOutput (nuclear coercion), validateDbaDraftOutput
  - `vitest.config.ts` aangemaakt, `package.json` uitgebreid met test/test:watch/test:coverage scripts
  - Vitest als devDependency toegevoegd (`^2.1.0`)
  - Eerste run vereist `npm install` in projectmap
- [x] **QUAL-002**: Integration test voor volledige analyse pipeline ✓ (2026-04-09)
  - `__tests__/analyzeDbaText.test.ts` aangemaakt — 21 tests
  - `analyzeDbaText`: insufficient_input zonder API-aanroep, happy path, riskLabel, retry bij ongeldige JSON, dubbele mislukking → FALLBACK, netwerkfout → FALLBACK, code fences, followUpQuestions, bedrijfstakcontext, coercering ongeldig label, model/max_tokens verificatie
  - `generateAssignmentDraft`: compact/full mode, max_tokens 700/2000, standaard compact, API-fout → FALLBACK, retry dubbele mislukking → FALLBACK, reusableBuildingBlocks arrays, model verificatie
  - Mock strategie: `vi.hoisted(() => vi.fn())` + `vi.mock('@anthropic-ai/sdk')` — omzeilt module-level singleton
- [x] **DOC-001**: Vercel deployment configuratie vastleggen ✓ (2026-04-09)
  - `vercel.json` aangemaakt: regio `fra1` (Frankfurt, GDPR), www-redirect naar canonical domein
  - `docs/DEPLOYMENT.md` aangemaakt: alle env vars, Stripe webhook config, productielaunch checklist
  - `.env.local.example` gecorrigeerd: `STRIPE_UPGRADE_CREDIT_COUPON_ID` → `STRIPE_COUPON_ONE_TIME_UPGRADE`

### LAAG (verbetering)

- [ ] **INFRA-001**: Custom SMTP instellen voor auth-e-mails — **IN PROGRESS, HANDMATIGE ACTIE**
  - **HUIDIGE STATUS (2026-04-10):**
    - DNS migratie naar Cloudflare gestart (STRATO kon geen subdomain MX)
    - Cloudflare: domein toegevoegd, alle records geïmporteerd, Resend MX record toegevoegd (`send` → amazonses.com, prio 10)
    - STRATO DNSSEC: deactivatie aangevraagd, status "Wordt gedeactiveerd" (verwerking loopt)
    - Nameserver-wissel nog niet doorgevoerd — wacht op DNSSEC deactivatie
  - **VOLGENDE ACTIE bij hervatten:**
    1. Check STRATO → DNS → DNSSEC: is status verdwenen of "Niet actief"?
    2. Zo ja: STRATO → DNS → NS-record → "Eigen nameservers" → `brett.ns.cloudflare.com` + `peaches.ns.cloudflare.com` → opslaan
    3. Cloudflare: klik "I updated my nameservers"
    4. Wacht op DNS propagatie + Cloudflare activatie (15 min tot 24 uur)
    5. Resend: herstart domeinverificatie → wacht op DKIM + SPF + MX alle Verified
    6. Supabase SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key, sender `DBA Kompas <noreply@dbakompas.nl>`
    7. Supabase: zet "Enable email confirmations" aan
    8. Test: nieuw account → verificatiemail van `noreply@dbakompas.nl`
- [ ] **MAIL-001**: `info@dbakompas.nl` instellen in Apple Mail — **NIEUW**
  - Doel: e-mail centraal ontvangen/versturen via Apple Mail i.p.v. STRATO webmail
  - IMAP: `imap.strato.de`, poort `993`, SSL/TLS
  - SMTP: `smtp.strato.de`, poort `465`, SSL/TLS
  - Gebruikersnaam: `info@dbakompas.nl`, wachtwoord: STRATO e-mailwachtwoord
  - Uitvoeren na voltooiing INFRA-001 (DNS stabiel)

- [x] **LOOPS-003**: Digest trigger geimplementeerd via Vercel Cron Jobs ✓ (2026-04-11)
  - `app/api/cron/weekly-digest/route.ts`: CRON_SECRET verificatie + alle actieve pro-gebruikers + sendWeeklyDigest
  - `app/api/cron/monthly-digest/route.ts`: zelfde voor maandelijks
  - `vercel.json` uitgebreid met cron: maandag 09:00 CET + 1e van de maand 09:00 CET
  - `CRON_SECRET` env var toegevoegd aan DEPLOYMENT.md + .env.local.example

- [~] **LOOPS-002**: Loops journeys aangemaakt — **GEDEELTELIJK KLAAR, wacht op livegang**
  - Journey B "DBA Kompas — Quick Scan Gemiddeld risico": ACTIEF + GETEST ✅
  - Journey A "DBA Kompas — Quick Scan Hoog risico": GEBOUWD, in Draft
  - Journey C "DBA Kompas — Quick Scan Laag risico": GEBOUWD, in Draft
  - **Resterende acties bij livegang op `dbakompas.nl`:**
    1. Journey A + C activeren via "Resume" in Loops
    2. In alle 9 emails CTA-URLs omzetten van `dba-kompas.vercel.app` naar `dbakompas.nl`
    3. Oude loops verwijderen: `quick_scan_completed - high`, `quick_scan_completed - medium`, `quick_scan_completed - low`

- [ ] **FEAT-002**: Admin panel voor contentbeheer (gidsen, nieuws)
- [ ] **FEAT-003**: Gidsen content schrijven en vullen

---

## UITGEWERKTE PLANNEN

### FEAT-004 — Paywall: toegang alleen voor betalende gebruikers

**Probleemstelling:**
Elke ingelogde gebruiker kan nu het dashboard bereiken, ook zonder betaald abonnement of aankoop. Dit moet worden geblokkeerd.

**Betaalde toegang geldt als:**
- Actief of trialing abonnement (`subscriptions.status IN ('active', 'trialing')`)
- Eenmalige aankoop (`one_time_purchases.status = 'purchased'` voor `product_type = 'one_time_dba'`)

**Benodigde wijzigingen:**

1. `modules/billing/entitlements.ts` — `getUserPlan()` uitbreiden
   - Na de subscriptions-check: ook `one_time_purchases` tabel bevragen
   - Als `one_time_purchases` rij gevonden met `status = 'purchased'` → return `'pro'`

2. `GET /api/user/plan` endpoint — nieuw
   - Bestand: `app/api/user/plan/route.ts`
   - Roept `getUserPlan()` aan server-side
   - Response: `{ plan: 'free' | 'pro' | 'enterprise' }`
   - Vereist authenticatie (401 als niet ingelogd)

3. `components/auth/AuthContext.tsx` — plan toevoegen
   - State: `plan: 'free' | 'pro' | 'enterprise' | null`
   - Effect: na user-confirmatie, fetch `/api/user/plan` en sla op in context

4. `app/(app)/layout.tsx` — paywallcheck in `AppShell`
   - Na user + plan geladen: als `plan === 'free'` → `router.push('/upgrade')`
   - Uitzondering: `/profiel` blijft altijd toegankelijk (account beheer)

5. `app/(app)/upgrade/page.tsx` — paywallpagina (nieuw)
   - Toont melding: "Kies een plan om toegang te krijgen"
   - Drie plankaarten (Eenmalig, Maandelijks, Jaarlijks) met "Kies dit plan"-knoppen
   - Knoppen roepen direct `/api/billing/checkout` of `/api/one-time/checkout` aan (user is al ingelogd)
   - Redirect naar Stripe checkout

**Data model:** geen wijzigingen — `one_time_purchases` en `subscriptions` tabellen bestaan al.

**Volgorde van implementatie:** stap 1 → 2 → 3 → 4 → 5

---

### FEAT-005 — One-time upsell e-mail + upgrade flow met Stripe coupon

**Probleemstelling:**
Gebruikers die een eenmalige check kopen (€9,95) moeten een bevestigingsmail ontvangen met een aanbod: eerste maand van het maandabonnement voor €10,05 (€9,95 korting). Na de eerste maand keert de prijs terug naar €20/maand.

**Architectuur:**

```
Stripe webhook (checkout.session.completed, mode=payment)
  → handleCheckoutCompleted()
    → one_time_purchases INSERT (al geïmplementeerd)
    → sendLoopsEvent('one_time_purchase', ...) (al geïmplementeerd)
    → [NIEUW] sendOneTimeUpsellEmail(email, userId)
         → Resend e-mail met upgrade link naar /upgrade-to-pro
```

**Benodigde wijzigingen:**

1. Stripe coupon aanmaken (handmatige stap, eenmalig)
   - Stripe Dashboard (test mode) → Coupons → Create
   - Name: `Welkomstkorting eenmalige check`
   - Amount off: €9,95 (995 eurocent)
   - Duration: `once` (alleen eerste factuur)
   - Currency: EUR
   - ID (optioneel): `ONETIMECREDIT`
   - Herhaal voor live mode vóór productie-launch
   - Voeg coupon ID toe als env var: `STRIPE_COUPON_ONE_TIME_UPGRADE=<coupon_id>`

2. `modules/email/send.ts` — upsell e-mail functie toevoegen
   - Functie: `sendOneTimeUpsellEmail(to: string)`
   - Verstuurt via Resend (bestaande `sendEmail()` helper)
   - Inhoud: bevestiging aankoop + upgradeaanbod + knop "Upgrade voor €10,05 eerste maand"
   - Link in e-mail: `https://dba-kompas.vercel.app/upgrade-to-pro`
   - E-mail volgt DBA Kompas huisstijl (zelfde HTML-structuur als verificatiemail)

3. `app/api/billing/webhook/route.ts` — upsell aanroep toevoegen
   - In `handleCheckoutCompleted()`, na de `one_time_purchases` INSERT:
   - `const email = await getUserEmailById(userId)`
   - `if (email) await sendOneTimeUpsellEmail(email)`

4. `app/(app)/upgrade-to-pro/page.tsx` — upgrade landingspagina (nieuw, server component)
   - Controleert authenticatie (redirect naar `/login?next=/upgrade-to-pro` als niet ingelogd)
   - Controleert of gebruiker een `one_time_purchase` heeft (zo niet: reguliere checkout zonder coupon)
   - Roept `stripe.checkout.sessions.create()` aan met:
     - `line_items: [{ price: STRIPE_PRICE_ID_MONTHLY, quantity: 1 }]`
     - `discounts: [{ coupon: process.env.STRIPE_COUPON_ONE_TIME_UPGRADE }]`
     - `mode: 'subscription'`
     - `customer_email: user.email` of `customer: stripe_customer_id`
   - Redirect direct naar `session.url` (geen tussenliggende pagina)

**Stripe couponmechanisme:**
- `duration: 'once'` = korting alleen op de eerste factuur
- Stripe past €9,95 automatisch af op de eerste maandbetaling (€20 − €9,95 = €10,05)
- Tweede maand en verder: gewone €20/maand
- Geen code-logica nodig voor terugkeer naar normale prijs — Stripe regelt dit

**Env vars benodigd:**
- `STRIPE_COUPON_ONE_TIME_UPGRADE` — coupon ID uit Stripe (test én live versie)

**Volgorde van implementatie:** stap 1 (Stripe coupon) → 2 → 3 → 4

---

## IN PROGRESS

- **INFRA-001**: DNS migratie naar Cloudflare — STRATO DNSSEC deactivatie afwachten, daarna NS-records wisselen. Zie TASKS.md LAAG sectie + PROJECT_STATE.md voor exacte stappen.

---

## DONE

### Sessie 2026-04-11 — Doc-sync + LOOPS-003

- [x] **LOOPS-003**: Vercel Cron Jobs aangemaakt voor weekly/monthly digest trigger
- [x] **Doc-sync**: 9 commits gesynchroniseerd die ontbraken in docs

---

### Sessie 2026-04-10 (na 7ceea92) — PostHog, QuickScan UX, security

- [x] **QUAL-003**: 13 unit tests voor `lib/loops` — `updateLoopsContact` + `sendLoopsEvent` (commit `1fbe8a4`)
- [x] **SEC-003**: proxy.ts verbeterd: `/register`, `/auth/`, `/api/loops/` als public route; login redirect met `?next=pathname` (commit `18310ce`)
- [x] **FIX-021**: `useSearchParams` in login page gewrapped in Suspense boundary voor Next.js static prerendering (commit `0c8a440`)
- [x] **FIX-022**: AppShell redirect naar `/login` aangevuld met `?next=pathname` zodat gebruiker na inloggen terugkomt op bedoelde pagina (commit `88366f1`)
- [x] **ANAL-001**: PostHog volledig geintegreerd — `lib/posthog.ts` server-side helper, `PostHogPageview` component, events op login / analyse / checkout / webhook (commit `5fc32a4`)
- [x] **ANAL-002**: PostHog identify op elke sessie + plan als person property, reset bij uitloggen (commit `47b709d`)
- [x] **ANAL-003**: Top-of-funnel QuickScan tracking — 5 events: `quick_scan_started`, `quick_scan_result_viewed`, `quick_scan_cta_clicked`, `quick_scan_completed`, `quick_scan_signup_clicked` (commit `e3d45e1`)
- [x] **UX-001**: Quick Scan succes-scherm hertworpen: risico-specifieke copy + twee directe betaalopties (eenmalig €9,95 / maandelijks €20) beide linkend naar `/register?plan=xxx&email=xxx` (commit `e5a13e7`)
- [x] **UX-001b**: Succes-scherm omgebouwd naar twee volwaardige pricing tiles — visueel consistent met design system (commit `0207697`)

---

### Sessie 2026-04-10 (avond) — Loops e-mailsequenties v2 + journeys gebouwd

- [x] **LOOPS-002 (deels)**: 9 e-mailsequenties herschreven (v2) — eerlijk over scan-beperkingen, urgentie, maandabonnement positionering
- [x] **LOOPS-002 (deels)**: Journey B "DBA Kompas — Quick Scan Gemiddeld risico" aangemaakt, geconfigureerd en geactiveerd in Loops — Send test verstuurd en ontvangen ✅
- [x] **LOOPS-002 (deels)**: Journey A "DBA Kompas — Quick Scan Hoog risico" gebouwd met volledige flow (in Draft — activeren bij livegang)
- [x] **LOOPS-002 (deels)**: Journey C "DBA Kompas — Quick Scan Laag risico" gebouwd met volledige flow (in Draft — activeren bij livegang)
- [x] **Loops flow-architectuur vastgesteld**: Branch + Audience filter (`subscription_status does not equal "active"`, All following nodes) als conversiestop — geen aparte Goal-functie in Loops
- [x] **Loops CTA-buttons**: echte Button blocks in emails i.p.v. platte tekst-links
- [x] **Register-link getest**: `/register?plan=one_time_dba&email=...` werkt correct (plan + email worden verwerkt), merge tag `{contact.email}` werkt alleen in echte verzonden mail
- [x] **Loops merge tag syntax bevestigd**: `{contact.email}` (één haakjeset in editor), niet `{{contact.email}}`

---

### Sessie 2026-04-09 — Conversie-funnel hersteld + modal geconsolideerd

- [x] **FIX-014**: `app/register/page.tsx` gebouwd — volledig signup + Stripe checkout formulier; pre-filled email/plan; directe checkout bij sessie, emailRedirectTo bij verificatie vereist
- [x] **FIX-015**: `app/checkout-redirect/page.tsx` gebouwd — auto-triggert checkout na e-mailverificatie via `/auth/callback?next=...` flow
- [x] **FIX-016**: `app/auth/signup/page.tsx` gebouwd — server redirect naar `/login` (target van QuickScan success screen)
- [x] **FIX-017**: `/api/billing/checkout` uitgebreid met `plan`-lookup (`monthly` → `STRIPE_PRICE_ID_MONTHLY`, `yearly` → `STRIPE_PRICE_ID_YEARLY`) — backwards compatible
- [x] **FIX-018**: `cancel_url` in `/api/billing/checkout` en `/api/one-time/checkout` gecorrigeerd van `/pricing` (404) naar `/dashboard`
- [x] **UX-006**: `EmailCheckoutModal` geconsolideerd — signUp logica direct in modal (geen redirect naar `/register` meer); stap 2 heeft plandropdown bovenin; verifyscherm binnen modal; knoptekst "Account aanmaken & betalen"; footer "Al een account? Inloggen →"
- [x] **FIX-019**: Supabase Site URL gecorrigeerd van `localhost:3000` naar `https://dba-kompas.vercel.app` — verificatiemail stuurde voorheen naar localhost
- [x] **FIX-020**: Redirect URL `https://dba-kompas.vercel.app/**` toegevoegd aan Supabase allowlist
- [x] **UX-007**: Supabase verificatiemail voorzien van DBA Kompas huisstijl (custom HTML template in Supabase Auth → Email Templates → Confirm signup)

---

### Sessie 2026-04-08 — Stripe fixes + Loops quick-scan + PDF

- [x] **FIX-010**: `buildFollowUpQuestions` import ontbrak in `dbaAnalysis.ts` → elke analyse gaf "Internal server error" (commit `92ea711`)
- [x] **FIX-011**: `STRIPE_ONE_TIME_DBA_PRICE_ID` → `STRIPE_PRICE_ID_ONE_TIME` in `app/api/one-time/checkout/route.ts` — was kritieke mismatch met `.env.local` waardoor one-time checkout altijd 500 gaf (commit `ae44683`)
- [x] **FIX-012**: `trialing` status telt nu als actief Pro-plan in `modules/billing/entitlements.ts` (commit `ae44683`)
- [x] **UX-004**: Dashboard succesbericht na geslaagde betaling — detecteert `?session_id=` URL param, cleant URL daarna (commit `ae44683`)
- [x] **FIX-PDF-001**: PDF kon niet renderen — pdfkit toegevoegd aan `serverExternalPackages` in `next.config.ts` (commit `b1569d3`)
- [x] **FIX-PDF-002**: PDF toonde ruwe JSON i.p.v. leesbare tekst — parseDraftJson helpers toegevoegd (commit `910ce2d`)
- [x] **FIX-PDF-003**: Domeinnamen toonden "Domein" — gebruik `d.title ?? d.domainName ?? d.key` (commit `a8c4268`)
- [x] **FIX-PDF-004**: Logo niet gevonden — `dba-kompas-logo.png` → `logo-flat-white.png` (commit `a8c4268`)
- [x] **FIX-PDF-005**: Full draft truncated bij max_tokens 1400 — verhoogd naar 2000 (commit `a8c4268`)
- [x] **REFACTOR-PDF**: Volledige PDF redesign — cream achtergrond alle pagina's, exacte underlines, inline score, `truncateSentence()`, `renderDraftCol()` helper, `autoFirstPage: false` (commit `a5bff30`)
- [x] **LOOPS-001**: `/api/loops/quick-scan` endpoint gebouwd — contact aanmaken/updaten + `quick_scan_completed` event sturen (commit `7c13cc5`)
- [x] **UX-005**: Quick scan success screen — "Ga verder" → `/auth/signup`, "Bekijk wat DBA Kompas biedt" → `/#pricing` (commit `7c13cc5`)
- [x] **TEST-001**: End-to-end analyse flow getest — werkt stabiel na import-fix
- [x] **TEST-004**: PDF download getest — werkt correct na alle PDF fixes

---

### Sessie 2026-04-08 — PERF-001: Draft generatie gesplitst

- [x] **PERF-001**: `buildDbaDraftGenerationPrompt` gesplitst in `buildCompactDraftPrompt` (max_tokens 700) + `buildFullDraftPrompt` (max_tokens 2000)
- [x] **PERF-001**: `generateAssignmentDraft` accepteert `mode: 'compact' | 'full'` param
- [x] **PERF-001**: Draft endpoint `/api/dba/analyse/[id]/draft` accepteert `?mode=compact|full` query param
- [x] **PERF-001**: `page.tsx` — compact laadt direct bij "Genereer", uitgebreid laadt lazy bij eerste tab-klik
- [x] **DOCS**: KI-004 rate limit inconsistentie gecorrigeerd (3/dag → 20/dag)

---

### Sessie 2026-04-07 — Stabilisatie & UX

- [x] **KI-006**: Fix Opus model in `rewriteNewsArticle`, `analyzeDocument`, `rewriteDocument` → Haiku
- [x] **UX-003**: Draft generatie alleen op expliciete knopklik — auto-trigger verwijderd
- [x] **UX-002**: Follow-up vragen als invulvelden op resultaatpagina — heranalyse knop toegevoegd
- [x] **UX-001**: `needs_more_input` blokkade verwijderd — analyse altijd uitvoeren bij >= 800 tekens
- [x] **SEC-002**: Rate limiting op `/api/dba/analyse` (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- [x] **SEC-001**: Debug endpoint `/app/api/debug/ai-test/` volledig verwijderd
- [x] **FIX-002**: JSON.parse try/catch toegevoegd in `retryWithAnthropicFix`
- [x] **FIX-001**: Fase 1 prompt afgeslankt — simulationFactState, simulationHints, followUpQuestions, additionalImprovements verwijderd
- [x] **ARCH-TWO-PHASE**: Two-phase architectuur (fase 1 snelle analyse, fase 2 async draft)
- [x] **PERF-HAIKU**: Overstap van `claude-opus-4-6` naar `claude-haiku-4-5-20251001` voor hoofdanalyse
- [x] **FIX-CODEFENCE**: Code fence stripping + outermost `{...}` extractie
- [x] **FIX-NUCLEAR**: Nuclear/coerce validator voor `validateDbaEngineOutput` + `validateDbaDraftOutput`
- [x] **FEAT-DRAFT-API**: Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft`)
- [x] **UI-REDESIGN**: Premium UI resultaatpagina (hero banner, 3-koloms domeinen, actiepunten)
- [x] **UI-FALLBACK**: isFallback-check + eigen foutscherm
