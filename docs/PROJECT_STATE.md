# PROJECT_STATE.md
**Laatst bijgewerkt:** 2026-04-07
**Maturity:** 82%

---

## SAMENVATTING

DBA Kompas is een Next.js 16.2 SaaS applicatie die opdrachtomschrijvingen analyseert op DBA-risico-indicatoren via Claude Haiku. De kernfunctionaliteit is stabiel en werkt. Alle kritieke AI-bugs zijn opgelost. De applicatie is klaar voor uitgebreide functionele tests.

---

## WAT WERKT

- Supabase authenticatie (email/password)
- DBA analyse via Claude Haiku (`claude-haiku-4-5-20251001`) — alle AI functies nu op Haiku
- Twee-fase architectuur: fase 1 = snelle kernanalyse, fase 2 = draft op aanvraag
- Input validatie (minimum 800 tekens / 120 woorden) — `needs_more_input` blokkade verwijderd
- Follow-up vragen als invulvelden op resultaatpagina — heranalyse met gecombineerde tekst
- Nuclear/coerce validator — altijd succesvol voor geldige JSON objecten
- Code fence stripping + outermost `{...}` extractie
- JSON.parse try/catch in alle AI-functies
- Resultaatpagina UI: colored hero banner, 3-koloms domeinkaarten, actiepunten
- Draft generatie op expliciete knopklik (geen auto-trigger)
- Gesplitste draft generatie: compact (max_tokens 700, ~3-5s) + uitgebreid (max_tokens 1400, ~8-12s, lazy)
- Uitgebreide draft laadt automatisch bij eerste klik op "Uitgebreid" tab
- Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft`)
- PDF rapport generatie (`lib/pdf/generate.ts`)
- Rate limiting op analyse endpoint (free: 20/dag, pro: 100/dag)
- Stripe betalingen (subscriptions + one-time) — code aanwezig, niet live getest
- Newsfeed, notificaties, documentbeheer
- Resend e-mail digests
- Loops marketing automation
- PostHog analytics
- Sentry error tracking

## WAT NIET WERKT / ONZEKER

- **ONTBREEKT**: Tests (unit, integratie, e2e) — regressions worden niet automatisch gedetecteerd
- **ONBEKEND**: Deployment (geen Vercel config gedocumenteerd)
- **ONBEKEND**: Stripe webhook live status — niet getest
- **ONBEKEND**: E-mail digest triggers — geen cron job gevonden
- **OPGELOST**: Fase 2 draft generatie — compact: ~3-5s, uitgebreid: ~8-12s (lazy op tab-klik)

---

## DEPLOYMENT STATUS

| Omgeving | Status | Onderbouwing |
|---|---|---|
| Lokaal | WERKEND | Bevestigd via tests |
| Vercel (main branch) | LIVE (vermoedelijk) | Auto-deploy via GitHub |
| Vercel config | ONGEDOCUMENTEERD | Geen vercel.json aanwezig |

---

## INTEGRATIE STATUS

| Systeem | Code aanwezig | Geconfigureerd | Live getest |
|---|---|---|---|
| Supabase Auth + DB | JA | JA | BEVESTIGD |
| Anthropic Claude Haiku | JA | JA | BEVESTIGD |
| Stripe | JA | JA | NEE |
| Resend | JA | JA | NEE |
| Loops | JA | JA | NEE |
| PostHog | JA | JA | ONBEKEND |
| Sentry | JA | JA | ONBEKEND |

---

## ARCHITECTUUR OORDEEL

Correct gestructureerd:
- Business logic in `lib/`, niet in UI components
- Alle AI-aanroepen via `claude-haiku-4-5-20251001` — geen Opus meer
- Supabase admin voor server-side mutaties (RLS bypass correct)
- Entitlements via `modules/billing/entitlements.ts`
- Prompt injection beveiliging aanwezig
- Follow-up vragen via signaaldetectie (geen extra AI-aanroep)

Aandachtspunten:
- `postProcessDbaOutput` verwerkt draft-velden die fase 1 niet meer levert (no-ops, KI-008)
- Fase 2 draft nog ~15-20s (PERF-001 open)
