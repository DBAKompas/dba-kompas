# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-07
**Maturity:** 72%

---

## SAMENVATTING

DBA Kompas is een Next.js 16.2 SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via de Claude Haiku AI. De kernfunctionaliteit is aanwezig en functioneel. Er zijn kritieke bugfixes doorgevoerd. De applicatie draait nog niet aantoonbaar in productie.

---

## WAT WERKT

- Supabase authenticatie (email/password)
- DBA analyse via Claude Haiku (`claude-haiku-4-5-20251001`)
- Twee-fase architectuur: fase 1 = snelle kernanalyse, fase 2 = async opdrachtdraft
- Input validatie (minimum 800 tekens / 120 woorden, 11 kwaliteitssignalen)
- Nuclear/coerce validator — altijd succesvol voor geldige JSON objecten
- Code fence stripping + outermost `{...}` extractie
- Resultaatpagina UI: colored hero banner, 3-koloms domeinkaarten, actiepunten
- Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft`)
- PDF rapport generatie (`lib/pdf/generate.ts`)
- Stripe betalingen (subscriptions + one-time) — code aanwezig, niet live getest
- Newsfeed, notificaties, documentbeheer
- Resend e-mail digests
- Loops marketing automation
- PostHog analytics
- Sentry error tracking

## WAT NIET WERKT / ONZEKER

- **KRITIEK**: Fase 1 prompt vraagt nog steeds om zware output (simulationFactState 18 velden + simulationHints + followUpQuestions) → kans op JSON truncation bij 2500 token limit → fallback
- **BUG**: `retryWithAnthropicFix` heeft JSON.parse zonder try/catch — stille crash bij truncated retry JSON
- **SECURITY**: Debug endpoint `/api/debug/ai-test` is publiek toegankelijk
- **ONTBREEKT**: Rate limiting op analyse endpoint
- **ONTBREEKT**: Tests (unit, integratie, e2e)
- **ONBEKEND**: Deployment (geen Vercel config gevonden)
- **ONBEKEND**: Stripe webhook live status
- **ONBEKEND**: E-mail triggers live status

---

## DEPLOYMENT STATUS

| Omgeving | Status | Onderbouwing |
|---|---|---|
| Lokaal | MOGELIJK WERKEND | .env.local.example aanwezig |
| Vercel Preview | ONBEKEND | Geen vercel.json |
| Productie | ONBEKEND | Geen deployment config |

---

## INTEGRATIE STATUS

| Systeem | Code aanwezig | Geconfigureerd | Live getest |
|---|---|---|---|
| Supabase Auth + DB | JA | JA | ONBEKEND |
| Anthropic Claude | JA | JA | GEDEELTELIJK |
| Stripe | JA | JA | NEE |
| Resend | JA | JA | NEE |
| Loops | JA | JA | NEE |
| PostHog | JA | JA | ONBEKEND |
| Sentry | JA | JA | ONBEKEND |

---

## ARCHITECTUUR OORDEEL

Correct gestructureerd:
- Business logic in `lib/`, niet in UI components
- Supabase admin voor server-side mutaties (RLS bypass correct)
- Entitlements via `modules/billing/entitlements.ts`
- Prompt injection beveiliging aanwezig

Aandachtspunten:
- `callAnthropicWithRetry` default model is `claude-opus-4-6` (traag/duur) — expliciete override nodig bij elke aanroep
- `postProcessDbaOutput` verwerkt draft-velden die fase 1 niet meer levert (no-ops maar verwarrend)
