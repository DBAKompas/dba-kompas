# DEPLOYMENT.md
**Vercel deployment-referentie voor DBA Kompas**
**Laatst bijgewerkt:** 2026-04-09

---

## Vercel configuratie

### vercel.json

```json
{
  "regions": ["fra1"],
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.dbakompas.nl" }],
      "destination": "https://dbakompas.nl/:path*",
      "permanent": true
    }
  ]
}
```

- **fra1** = Frankfurt — EU-regio, vereist voor GDPR-compliance
- Redirect: `www.dbakompas.nl` → `dbakompas.nl` (canonical domein zonder www)

### Function timeouts

Ingesteld in de routebestanden zelf (Next.js App Router):

```ts
export const maxDuration = 120  // seconden
```

Actief in:
- `app/api/dba/analyse/route.ts` — AI-analyse fase 1
- `app/api/dba/analyse/[id]/draft/route.ts` — AI-analyse fase 2 (draft)

Overige routes (Stripe webhook, billing, profiel) hebben de Vercel default (10s Hobby / 15s Pro).

---

## Omgevingsvariabelen

Alle variabelen moeten worden ingesteld in **Vercel Dashboard → Project → Settings → Environment Variables**, voor omgeving `Production` en `Preview`.

### Supabase

| Variabele | Scope | Verplicht |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | JA |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | JA |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | JA |

**Let op:** `SUPABASE_SERVICE_ROLE_KEY` heeft volledige databasetoegang (bypast RLS). Nooit blootstellen aan de client.

Supabase Dashboard vereiste instellingen:
- Authentication → URL Configuration → Site URL: `https://dbakompas.nl`
- Authentication → URL Configuration → Redirect URLs: `https://dbakompas.nl/**`

### Anthropic (Claude AI)

| Variabele | Scope | Verplicht |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | JA |

Haal op via: [console.anthropic.com](https://console.anthropic.com)

### Stripe

| Variabele | Scope | Test waarde | Productie waarde |
|---|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | `pk_test_...` | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Server only | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Server only | `whsec_...` (test) | `whsec_...` (live) |
| `STRIPE_PRICE_ID_MONTHLY` | Server only | `price_...` (test) | `price_...` (live) |
| `STRIPE_PRICE_ID_YEARLY` | Server only | `price_...` (test) | `price_...` (live) |
| `STRIPE_PRICE_ID_ONE_TIME` | Server only | `price_...` (test) | `price_...` (live) |
| `STRIPE_COUPON_ONE_TIME_UPGRADE` | Server only | `ONETIMECREDIT` | *(aan te maken)* |

**Stripe webhook configuratie:**

Test mode:
- Naam: `dba-kompas-vercel-test`
- URL: `https://dba-kompas.vercel.app/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

Live mode (vóór productielaunch):
- URL: `https://dbakompas.nl/api/billing/webhook`
- Zelfde 5 events
- Nieuw signing secret kopiëren naar `STRIPE_WEBHOOK_SECRET` in Vercel

**Coupon voor upgrade-to-pro flow:**
- Test mode: `ONETIMECREDIT` — al aangemaakt (€9,95 korting, eenmalig)
- Live mode: identieke coupon aanmaken in Stripe Dashboard → Coupons → "ONETIMECREDIT"

### Resend (transactionele e-mail)

| Variabele | Scope | Verplicht |
|---|---|---|
| `RESEND_API_KEY` | Server only | JA |

Haal op via: [resend.com/api-keys](https://resend.com/api-keys)

Verstuurt: one-time upsell e-mail na aankoop. Verzenddomein moet geverifieerd zijn in Resend dashboard.

### Loops (marketing automation)

| Variabele | Scope | Verplicht |
|---|---|---|
| `LOOPS_API_KEY` | Server only | JA |

Haal op via: Loops Dashboard → Settings → API

Stuurt events: `quick_scan_completed`, `subscription_started`, `subscription_canceled`, `payment_failed`, `one_time_purchase`.

### PostHog (analytics)

| Variabele | Scope | Verplicht |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | JA |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | JA |

Standaard host: `https://eu.i.posthog.com` (EU-regio).

### Sentry (foutmonitoring)

| Variabele | Scope | Verplicht |
|---|---|---|
| `SENTRY_DSN` | Client + Server | JA |

### App

| Variabele | Scope | Waarde |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client + Server | `https://dbakompas.nl` (productie) |

---

## Huidig domein (test/acceptatie)

`https://dba-kompas.vercel.app` — Vercel preview/test URL

Actief tijdens ontwikkelingsfase. Alle Stripe-webhooks, Supabase redirect URLs en Loops-events zijn op dit adres geconfigureerd.

---

## Productielaunch checklist

Vóór overschakelen naar `dbakompas.nl`:

1. Stripe keys wisselen naar live mode (`sk_live_...`, `pk_live_...`) in Vercel env vars
2. Stripe webhook aanmaken in live mode: `https://dbakompas.nl/api/billing/webhook` (5 events) — nieuw signing secret in `STRIPE_WEBHOOK_SECRET`
3. Coupon `ONETIMECREDIT` aanmaken in Stripe live mode Dashboard
4. Supabase Site URL bijwerken naar `https://dbakompas.nl`
5. Supabase Redirect URL bijwerken naar `https://dbakompas.nl/**`
6. `NEXT_PUBLIC_APP_URL` updaten naar `https://dbakompas.nl`
7. Domein `dbakompas.nl` koppelen in Vercel Dashboard → Domains
8. E-mailbevestiging inschakelen in Supabase Auth (na INFRA-001: custom SMTP)
9. Resend verzenddomein `dbakompas.nl` verifiëren
10. Stripe live mode betaling end-to-end testen
