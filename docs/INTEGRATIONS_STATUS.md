# INTEGRATIONS_STATUS.md
**Status van alle externe integraties**
**Laatst bijgewerkt:** 2026-04-13 (sessie 7)

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
| Site URL | `https://dbakompas.nl` ✅ (bijgewerkt 2026-04-12) |
| Redirect allowlist | `https://dba-kompas.vercel.app/**` + `https://dbakompas.nl/**` ✅ |
| E-mailbevestiging | INGESCHAKELD ✅ (2026-04-12) |
| Custom SMTP | Resend — `smtp.resend.com:465`, user `resend` ✅ (2026-04-12) |
| Verificatiemail template | DBA Kompas huisstijl: donker navy, Rethink Sans, oranje CTA, v3 full logo ✅ |
| Logo in template | `https://dbakompas.nl/logo-white-v3-full.png` ✅ (bijgewerkt 2026-04-13) |
| Live getest | BEVESTIGD ✅ — verificatiemail end-to-end werkend (2026-04-13) |

**Risico's:**
- Geen fallback als Supabase tijdelijk onbereikbaar is
- RLS policies niet geaudit voor correctheid

**Nog te doen:**
- RLS policies auditen (kan gebruiker A data van gebruiker B zien?)

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
| Env variabelen gedocumenteerd | JA (7 variabelen) |
| Huidige mode | TEST MODE (sk_test_..., pk_test_...) |
| Subscription checkout | GEÏMPLEMENTEERD — TEST-002 BEVESTIGD WERKEND |
| One-time checkout | GEÏMPLEMENTEERD — env var bug OPGELOST (KI-011) |
| Webhook handler | GEÏMPLEMENTEERD (met idempotency) — TEST-003 BEVESTIGD WERKEND ✅ |
| Customer portal | GEÏMPLEMENTEERD |
| Entitlement check | GEÏMPLEMENTEERD (`modules/billing/entitlements.ts`) |
| `trialing` als actief plan | JA — OPGELOST (KI-012) |
| `one_time_purchases` als Pro | JA — GEÏMPLEMENTEERD (FEAT-004) |
| Dashboard success banner | JA — GEÏMPLEMENTEERD |
| One-time upsell coupon | JA — `ONETIMECREDIT` test mode aangemaakt (FEAT-005) |
| Upgrade-to-pro flow | JA — `/upgrade-to-pro` server component (FEAT-005) |
| iDEAL bij subscription | VERWIJDERD (werkt niet bij recurring) |

**Vereiste env vars (Vercel + lokaal):**
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
STRIPE_PRICE_ID_ONE_TIME=price_...
STRIPE_COUPON_ONE_TIME_UPGRADE=ONETIMECREDIT
```

**Stripe Dashboard webhook (test mode):**
- Naam: `dba-kompas-vercel-test`
- URL: `https://dba-kompas.vercel.app/api/billing/webhook`
- Events: 5 (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed)
- Status: aangemaakt 2026-04-09, signing secret in Vercel gezet, redeployed
- Delivery: BEVESTIGD WERKEND (2026-04-09) — billing_events + subscriptions + profiles correct bijgewerkt

**Vóór live launch (productie):**
- Stripe keys wisselen naar live mode (`sk_live_...`, `pk_live_...`) in Vercel
- Coupon `ONETIMECREDIT` aanmaken in Stripe live mode Dashboard + `STRIPE_COUPON_ONE_TIME_UPGRADE` updaten
- Webhook endpoint configureren in Stripe Dashboard: `https://dbakompas.nl/api/billing/webhook`
- Stripe e-mail bevestigingsflow testen met live mode

**Risico's:**
- TEST-003 BEVESTIGD WERKEND (2026-04-09) — `billing_events` + `subscriptions` + `profiles` correct bijgewerkt ✅
- Coupon `ONETIMECREDIT` bestaat alleen in test mode — live launch geblokkeerd tot live coupon aangemaakt is

---

## Resend (E-mail)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Env variabelen gedocumenteerd | JA |
| Wekelijkse digest | GEÏMPLEMENTEERD |
| Maandelijkse digest | GEÏMPLEMENTEERD |
| Urgente notificaties | GEÏMPLEMENTEERD |
| One-time upsell e-mail | GEÏMPLEMENTEERD (`sendOneTimeUpsellEmail` in `modules/email/send.ts`) |
| Welkomstmail eenmalige check | GEÏMPLEMENTEERD — Resend Template `103d7be2-e2a6-48e6-9c29-5db48de2b338` ✅ |
| Welkomstmail maandabonnement | GEÏMPLEMENTEERD — Resend Template `11387950-bdd2-4e81-bf5c-fde9f60d1baa` ✅ |
| Welkomstmail jaarabonnement | GEÏMPLEMENTEERD — Resend Template `02824f32-0da5-407c-b44e-3b89c0ea2d52` ✅ |
| Domein geverifieerd | `dbakompas.nl` VERIFIED ✅ (2026-04-12) |
| Trigger mechanisme digests | GEÏMPLEMENTEERD via Vercel Cron Jobs (LOOPS-003) ✅ |
| Upsell e-mail trigger | Stripe webhook `checkout.session.completed` (mode=payment) |
| Welkomstmail trigger | Stripe webhook `checkout.session.completed` (mode=payment + subscription) |
| `RESEND_API_KEY` in Vercel | INGESTELD ✅ (2026-04-13) |
| Resend template env vars | INGESTELD in Vercel ✅ (2026-04-13) |
| Live getest | GEDEELTELIJK — Supabase SMTP verificatiemail werkend ✅, welkomstmails wachten op live Stripe betaling |

**One-time upsell e-mail details:**
- Verstuurd via: Stripe webhook → `handleCheckoutCompleted()` → `sendOneTimeUpsellEmail(email)`
- Subject: "Je DBA-check is klaar — upgrade voor €10,05 eerste maand"
- Inhoud: bevestiging aankoop + upgradeaanbod + knop "Upgrade voor €10,05 eerste maand" → `/upgrade-to-pro`
- Fout afgevangen met `.catch()` — webhook fout niet bij e-mailprobleem

**Digest trigger (LOOPS-003 AFGEROND):**
- `app/api/cron/weekly-digest/route.ts`: elke maandag 07:00 UTC, beveiligd via `CRON_SECRET`
- `app/api/cron/monthly-digest/route.ts`: elke 1e van de maand 07:00 UTC, beveiligd via `CRON_SECRET`
- `vercel.json` uitgebreid met `crons` sectie ✅

**SPF-record (gecombineerd):**
`v=spf1 include:amazonses.com include:_spf.strato.com ~all` — dekt zowel Resend (Amazon SES) als STRATO (Apple Mail inbound)

**Risico's:**
- Geen unsubscribe mechanisme zichtbaar in code
- Welkomstmails nog niet live getest — volgt automatisch bij eerste live Stripe betaling (na STRIPE-LIVE)

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
| `subscription_status` contact property update | GEÏMPLEMENTEERD (webhook handler bij aankoop) |
| Deduplicatie | JA (Map-based, in-memory — zie KI-013) |
| Journey A (Hoog risico) | GEBOUWD in Loops dashboard — DRAFT (activeren bij livegang) |
| Journey B (Gemiddeld risico) | GEBOUWD + ACTIEF + GETEST ✅ |
| Journey C (Laag risico) | GEBOUWD in Loops dashboard — DRAFT (activeren bij livegang) |
| E-mailsequenties v2 | 9 emails geschreven (3 per niveau) — in journeys geladen |
| CTA-buttons | Button blocks met Vercel-URL (omzetten naar dbakompas.nl bij livegang) |
| Conversiestop flow | Audience filter `subscription_status does not equal "active"` na elke Branch |
| Merge tag syntax | `{contact.email}` (één haakjeset in Loops editor) |
| Live getest | Journey B: Send test ontvangen ✅ |

**Journey flow-architectuur (alle 3 journeys):**
```
Event received (quick_scan_completed, one time)
  → Audience filter (Quick_scan_risk_level = hoog/gemiddeld/laag, All following nodes)
  → Send email X1
  → Branch (1 branch)
  → Audience filter (subscription_status does not equal "active", All following nodes)
  → Timer (4 days)
  → Send email X2
  → Branch (1 branch)
  → Audience filter (subscription_status does not equal "active", All following nodes)
  → Timer (7 days)
  → Send email X3
  → Loop completed
```

**Afgerond (2026-04-11):**
- Journey A + C geactiveerd ✅
- Alle 9 CTA-URLs omgezet naar `dbakompas.nl` ✅

**Resterende actie bij livegang:**
- Oude journeys verwijderen: `quick_scan_completed - high`, `quick_scan_completed - medium`, `quick_scan_completed - low`

**DNS-afhankelijkheid (AFGEROND):**
- Sending domain gewijzigd naar `dbakompas.nl` in Loops Dashboard ✅
- Alle 5 DNS-records aangemaakt in Cloudflare en geverifieerd door Loops ✅
- Envelope MX-record probleem opgelost: expliciete MX voor `envelope.dbakompas.nl` overschrijft wildcard ✅

**Risico's:**
- KI-013: Loops deduplicatie is in-memory (Map) — reset bij cold start. Acceptabel voor huidige schaal.
- Digest trigger: OPGELOST via LOOPS-003 (Vercel Cron Jobs, commit `c853b45`) ✅

---

## PostHog (Analytics)

| Aspect | Status |
|---|---|
| Code aanwezig | JA |
| Provider geconfigureerd | JA (`components/providers/posthog-provider.tsx`) |
| Events getracked | JA — ANAL-001/002/003: login, analyse, checkout, quick_scan (5 events), identify + plan |
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
