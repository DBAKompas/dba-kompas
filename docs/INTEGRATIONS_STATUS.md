# INTEGRATIONS_STATUS.md
**Status van alle externe integraties**
**Laatst bijgewerkt:** 2026-04-08

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
| Live getest | BEVESTIGD (auth + analyse werkt) |

**Risico's:**
- Geen fallback als Supabase tijdelijk onbereikbaar is
- RLS policies niet geaudit voor correctheid

**Nog te testen:**
- RLS policies (kan gebruiker A data van gebruiker B zien?)
- Supabase connection limits onder load

---

## Anthropic Claude (AI Analyse)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| Model fase 1 | `claude-haiku-4-5-20251001` |
| Model fase 2 (draft) | `claude-haiku-4-5-20251001` |
| Model alle overige calls | `claude-haiku-4-5-20251001` |
| Max tokens fase 1 | 2500 |
| Max tokens fase 2 compact | 700 |
| Max tokens fase 2 full | 2000 |
| Retry mechanisme | JA (1 retry via `retryWithAnthropicFix`) |
| JSON.parse try/catch overal | JA |
| Live getest | BEVESTIGD (stabiel) |

**Risico's:**
- Geen rate limiting op Anthropic API aanroepen (beschermd via user rate limit)
- Haiku is niet deterministisch — output formaat varieert

**Nog te testen:**
- Gedrag bij Anthropic API timeout
- Gedrag bij Anthropic rate limit

---

## Stripe (Betalingen)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA (6 variabelen) |
| Subscription checkout | GEÏMPLEMENTEERD |
| One-time checkout | GEÏMPLEMENTEERD — env var bug OPGELOST (KI-011) |
| Webhook handler | GEÏMPLEMENTEERD (met idempotency) |
| Customer portal | GEÏMPLEMENTEERD |
| Entitlement check | GEÏMPLEMENTEERD (`modules/billing/entitlements.ts`) |
| `trialing` als actief plan | JA — OPGELOST (KI-012) |
| Dashboard success banner | JA — GEÏMPLEMENTEERD |
| Live getest | NEE — klaar voor TEST-002/003 |

**Vereiste env vars (Vercel + lokaal):**
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
STRIPE_PRICE_ID_ONE_TIME=price_...
```

**Volgende stap:** TEST-002 (checkout) + TEST-003 (webhook) — zie PROJECT_STATE.md voor exacte instructies.

**Risico's:**
- Webhook endpoint URL moet correct geconfigureerd zijn in Stripe Dashboard: `https://dbakompas.nl/api/billing/webhook`
- `STRIPE_UPGRADE_CREDIT_COUPON_ID` aanwezig maar gebruik niet gecontroleerd
- Geen test voor mislukte betalingen of chargebacks

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

---

## Loops (Marketing Automation)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| `quick_scan_completed` event | GEÏMPLEMENTEERD (`/api/loops/quick-scan`) |
| `subscription_started` event | GEÏMPLEMENTEERD (webhook handler) |
| `subscription_canceled` event | GEÏMPLEMENTEERD (webhook handler) |
| `payment_failed` event | GEÏMPLEMENTEERD (webhook handler) |
| `one_time_purchase` event | GEÏMPLEMENTEERD (webhook handler) |
| Deduplicatie | JA (Map-based, in-memory — zie KI-013) |
| Loops account geconfigureerd | PENDING — "Domain in use" issue bij setup nieuwe omgeving |
| Live getest | NEE |

**Pending:**
- LOOPS-002: Custom contactvelden instellen in Loops dashboard (`quick_scan_completed`, `quick_scan_risk_level`, `quick_scan_score`) en e-mailsequentie koppelen aan `quick_scan_completed` event

**Workaround Loops domain issue:**
Gebruik het bestaande Loops account — niet een nieuwe omgeving aanmaken. De API key van het bestaande account werkt voor `dbakompas.nl`.

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
| DSN geconfigureerd | ONBEKEND (env var aanwezig in `.env.local`) |
| Live getest | ONBEKEND |
