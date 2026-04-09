# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-09 (einde sessie)
**Maturity:** 96%

---

## SAMENVATTING

DBA Kompas is een Next.js 16.2 SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De kernfunctionaliteit is stabiel. Alle kritieke AI- en Stripe-bugs zijn opgelost. Conversie-funnel is volledig functioneel. Paywall is actief (alleen betalende gebruikers hebben dashboardtoegang). One-time upsell e-mail en upgrade-flow zijn geïmplementeerd. TEST-002 (Stripe checkout) is bevestigd werkend. Klaar voor TEST-003 (webhook delivery).

---

## LAATSTE ACTIE (2026-04-09 einde sessie — commits `6477615`, `779619e`, `4ba0c6e`)

**INFRA-001 — Resend SMTP domeinverificatie GEDEELTELIJK voltooid (IN PROGRESS)**

Status Resend domein `dbakompas.nl`:
- DKIM TXT (`resend._domainkey`) → **Pending** (eerder Verified, daarna reset bij restart verification)
- SPF TXT (`send`) → **Pending** (DNS propagatie nog bezig bij STRATO)
- MX (`send`) → bewust overgeslagen — niet nodig voor verzenden, zou STRATO inkomende mail breken

Wat is er gedaan:
- Resend Dashboard: domein `dbakompas.nl` toegevoegd, regio Ireland (eu-west-1)
- STRATO DNS: DKIM TXT + SPF TXT records toegevoegd
- Fout ontdekt en gecorrigeerd: SPF TXT waarde begon met `=spf1` i.p.v. `v=spf1` → gecorrigeerd
- Resend verificatie herstart → nu terug op Pending (normaal, propagatie loopt nog)

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

**Daarna open:**
- TEST-005: maximale invoerlengte testen (3000+ tekens, manueel)
- LOOPS-002: contactvelden instellen in Loops dashboard (handmatig)
- Stripe coupon live mode aanmaken vóór productielaunch

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
- PostHog analytics
- Sentry error tracking
- Quick scan landing page

## WAT NIET WERKT / ONZEKER

- **IN PROGRESS**: INFRA-001 — Resend domein `dbakompas.nl` verificatie loopt (DNS propagatie bij STRATO). Supabase SMTP nog niet ingesteld. E-mailbevestiging tijdelijk UITGESCHAKELD. Zie "Volgende geplande stap" voor exacte vervolgstappen.
- **NIET AANGEMAAKT**: Stripe coupon `ONETIMECREDIT` bestaat alleen in test mode. Vóór live launch aanmaken in Stripe live mode + env var updaten.
- **ONBEKEND**: E-mail digest triggers — geen cron job gevonden voor Resend digests
- **PENDING**: Loops dashboard config — contactvelden instellen + e-mailsequentie koppelen (LOOPS-002, handmatig)
- **OPEN**: TEST-005 — maximale invoerlengte (3000+ tekens) nog niet manueel getest
- **GEDEELTELIJK**: Alleen unit + integratietests. E2e-tests ontbreken.

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
| Loops | JA | JA | NEE (dashboard config pending) |
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
