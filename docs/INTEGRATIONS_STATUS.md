# INTEGRATIONS_STATUS.md
**Status van alle externe integraties**
**Laatst bijgewerkt:** 2026-04-07

---

## Supabase (Database + Auth)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| Auth (email/password) | GEÏMPLEMENTEERD |
| RLS op alle tabellen | GEÏMPLEMENTEERD |
| Server-side client | GEÏMPLEMENTEERD (`lib/supabase/server.ts`) |
| Admin client (service role) | GEÏMPLEMENTEERD (`lib/supabase/admin.ts`) |
| Live getest | ONBEKEND |

**Risico's:**
- Geen fallback als Supabase tijdelijk onbereikbaar is
- RLS policies niet geaudit voor correctheid

**Nog te testen:**
- Auth flow (registratie → verificatie → login)
- RLS policies (kan gebruiker A data van gebruiker B zien?)
- Supabase connection limits onder load

---

## Anthropic Claude (AI Analyse)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| Model fase 1 | `claude-haiku-4-5-20251001` |
| Model default (andere calls) | `claude-opus-4-6` (RISICO — zie KI-006) |
| Max tokens fase 1 | 2500 |
| Max tokens fase 2 | 2000 |
| Retry mechanisme | JA (1 retry via `retryWithAnthropicFix`) |
| JSON.parse try/catch in retry | NEE (zie KI-002) |
| Live getest | GEDEELTELIJK |

**Risico's:**
- Token truncation bij zware prompt output (KI-001) — fix gepland
- Geen rate limiting op Anthropic API aanroepen
- Haiku is niet deterministisch — output formaat varieert

**Nog te testen:**
- Volledige analyse flow zonder fallback na KI-001 fix
- Gedrag bij Anthropic API timeout
- Gedrag bij Anthropic rate limit

---

## Stripe (Betalingen)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA (6 variabelen) |
| Subscription checkout | GEÏMPLEMENTEERD |
| One-time checkout | GEÏMPLEMENTEERD |
| Webhook handler | GEÏMPLEMENTEERD (met idempotency) |
| Customer portal | GEÏMPLEMENTEERD |
| Entitlement check | GEÏMPLEMENTEERD (`modules/billing/entitlements.ts`) |
| Live getest | NEE |

**Risico's:**
- Webhook endpoint URL moet correct geconfigureerd zijn in Stripe Dashboard
- `STRIPE_UPGRADE_CREDIT_COUPON_ID` aanwezig maar gebruik niet gecontroleerd
- Geen test voor mislukte betalingen of chargebacks

**Nog te testen:**
- Subscription aanmaken via Stripe test mode
- Webhook delivery naar applicatie
- Subscription annulering
- Upgrade van free naar pro

---

## Resend (E-mail)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| Wekelijkse digest | GEÏMPLEMENTEERD |
| Maandelijkse digest | GEÏMPLEMENTEERD |
| Urgente notificaties | GEÏMPLEMENTEERD |
| Trigger mechanisme | ONBEKEND (geen cron job gevonden) |
| Live getest | NEE |

**Risico's:**
- Geen trigger gevonden die digests automatisch verstuurt
- Geen unsubscribe mechanisme zichtbaar in code

**Nog te testen:**
- Handmatig digest triggeren via test endpoint of script
- E-mail afleveringsrate controleren

---

## Loops (Marketing Automation)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| Events geïmplementeerd | analysis_started, analysis_completed, subscription events |
| Deduplicatie | JA (Map-based) |
| Live getest | NEE |

**Risico's:**
- Deduplicatie is in-memory — herstart van server reset de Map
- Loops account niet geconfigureerd (onbekend)

---

## PostHog (Analytics)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Provider geconfigureerd | JA (`components/providers/posthog-provider.tsx`) |
| Events getracked | ONBEKEND (geen specifieke event calls gevonden) |
| Live getest | ONBEKEND |

---

## Sentry (Error Tracking)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Client config | JA (`sentry.client.config.ts`) |
| Server config | JA (`sentry.server.config.ts`) |
| Edge config | JA (`sentry.edge.config.ts`) |
| DSN geconfigureerd | ONBEKEND (env var aanwezig in .env.local.example) |
| Live getest | ONBEKEND |
