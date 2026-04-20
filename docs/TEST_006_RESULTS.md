# TEST-006 — Welkomstmail end-to-end (Postmark)

**Doel:** volledige keten valideren `Stripe live checkout → checkout.session.completed → sendPurchaseWelcomeEmail → Postmark template → inbox` voor alle drie productvarianten. Na succes wordt KI-019 gesloten en TEST-006 op DONE gezet.

**Uitvoerder:** Marvin
**Startdatum uitvoering:** YYYY-MM-DD
**Einddatum uitvoering:** YYYY-MM-DD
**Eindstatus:** [ ] PASS [ ] FAIL [ ] PARTIAL

---

## Preflight checks

### A1 — Postmark

- [ ] Server status: Approved (geen Pending approval banner)
- [ ] Stream `outbound` actief
- [ ] Template alias `welkomstmail-eenmalig` bestaat en is published
- [ ] Template alias `welkomstmail-maand` bestaat en is published
- [ ] Template alias `welkomstmail-jaar` bestaat en is published
- [ ] Sender signature `noreply@dbakompas.nl` geverifieerd
- [ ] DKIM `dbakompas.nl` groen
- [ ] Return-Path `dbakompas.nl` groen
- [ ] TemplateModel-variabelen in elke template: welke verwacht de template? (vul in)
  - `welkomstmail-eenmalig`: _____________
  - `welkomstmail-maand`: _____________
  - `welkomstmail-jaar`: _____________
  - [ ] Komt overeen met `TemplateModel: {}` in `modules/email/send.ts` (leeg), of er zijn geen variabelen

### A2 — Vercel

- [ ] `POSTMARK_SERVER_TOKEN` aanwezig in Production env
- [ ] `STRIPE_WEBHOOK_SECRET` aanwezig in Production env
- [ ] `SENTRY_DSN` aanwezig in Production env (voor observability)
- [ ] `ADMIN_ALERT_EMAIL` aanwezig in Production env (fallback is marvinzoetemelk@gmail.com)
- [ ] Laatste deployment succesvol

### A3 — Stripe live mode

- [ ] Endpoint `https://dbakompas.nl/api/billing/webhook` bestaat
- [ ] Events aangevinkt: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- [ ] Signing secret in Vercel matcht endpoint secret in Stripe dashboard
- [ ] Recent deliveries toont 2xx responses (geen 4xx/5xx backlog)

---

## Test B1 — one_time

**Testaccount:** `marvinzoetemelk+dbatest1@gmail.com`
**Timestamp start:** __________
**Timestamp aankoop:** __________

### Uitvoer

- [ ] Account aangemaakt
- [ ] Email-verificatie ontvangen (Supabase auth signup mail, los van welkomstmail)
- [ ] Ingelogd
- [ ] One-time aankoop voltooid via live Stripe checkout
- [ ] Stripe dashboard toont PaymentIntent status `succeeded`

### Verificatie

- [ ] Welkomstmail in inbox binnen 60s
- [ ] From: `DBA Kompas <noreply@dbakompas.nl>`
- [ ] Inhoud klopt met `welkomstmail-eenmalig` copy (geen placeholders zichtbaar)
- [ ] CTA-link opent dashboard
- [ ] Postmark Activity: status `Delivered`, template `welkomstmail-eenmalig`, stream `outbound`
- [ ] Vercel Logs `/api/billing/webhook` → 200, geen `handleWelcomeMailFailure` entries
- [ ] Supabase `billing_events`: 1 nieuwe rij, `event_type = 'checkout.session.completed'`
- [ ] Supabase `admin_alerts`: geen nieuwe rij voor deze run
- [ ] Sentry: geen nieuw event met tag `area=welcome_email`

**Uitkomst:** [ ] PASS [ ] FAIL
**Bewijs (Postmark message-id):** __________
**Notities:** __________

---

## Test B2 — monthly

**Testaccount:** `marvinzoetemelk+dbatest2@gmail.com`
**Timestamp start:** __________
**Timestamp aankoop:** __________

### Uitvoer

- [ ] Account aangemaakt
- [ ] Email-verificatie ontvangen
- [ ] Ingelogd
- [ ] Maandelijks abonnement afgesloten via live Stripe checkout
- [ ] Stripe dashboard toont Subscription status `active` of `trialing`

### Verificatie

- [ ] Welkomstmail in inbox binnen 60s
- [ ] From: `DBA Kompas <noreply@dbakompas.nl>`
- [ ] Inhoud klopt met `welkomstmail-maand` copy
- [ ] CTA-link opent dashboard
- [ ] Postmark Activity: status `Delivered`, template `welkomstmail-maand`
- [ ] Vercel Logs → 200, geen welkomstmail-fouten
- [ ] Supabase `billing_events`: nieuwe rij `checkout.session.completed` én vervolg-event voor subscription
- [ ] Supabase `subscriptions`: nieuwe rij met `plan = monthly`, correcte `current_period_end`
- [ ] Supabase `admin_alerts`: geen nieuwe rij
- [ ] Sentry: geen nieuw event

**Uitkomst:** [ ] PASS [ ] FAIL
**Bewijs (Postmark message-id):** __________
**Notities:** __________

---

## Test B3 — yearly

**Testaccount:** `marvinzoetemelk+dbatest3@gmail.com`
**Timestamp start:** __________
**Timestamp aankoop:** __________

### Uitvoer

- [ ] Account aangemaakt
- [ ] Email-verificatie ontvangen
- [ ] Ingelogd
- [ ] Jaarabonnement afgesloten via live Stripe checkout
- [ ] Stripe dashboard toont Subscription status `active` of `trialing`

### Verificatie

- [ ] Welkomstmail in inbox binnen 60s
- [ ] From: `DBA Kompas <noreply@dbakompas.nl>`
- [ ] Inhoud klopt met `welkomstmail-jaar` copy
- [ ] CTA-link opent dashboard
- [ ] Postmark Activity: status `Delivered`, template `welkomstmail-jaar`
- [ ] Vercel Logs → 200, geen welkomstmail-fouten
- [ ] Supabase `billing_events`: nieuwe rij
- [ ] Supabase `subscriptions`: nieuwe rij met `plan = yearly`
- [ ] Supabase `admin_alerts`: geen nieuwe rij
- [ ] Sentry: geen nieuw event

**Uitkomst:** [ ] PASS [ ] FAIL
**Bewijs (Postmark message-id):** __________
**Notities:** __________

---

## Nazorg

- [ ] Drie test-betalingen gerefund via Stripe dashboard (Payments → refund)
- [ ] Drie testaccounts gedeactiveerd of verwijderd uit Supabase Auth (optioneel)
- [ ] Referral-tracking rows van testaccounts opgeruimd indien nodig
- [ ] Admin alerts van voortijdige fouten opgelost of op `resolved` gezet

---

## Afsluiting

Bij 3x PASS:

- [ ] `docs/TASKS.md`: TEST-006 naar DONE verplaatsen, mijlpaal-notitie toevoegen
- [ ] `docs/KNOWN_ISSUES.md`: KI-019 status → OPGELOST, datum toevoegen
- [ ] `docs/PROJECT_STATE.md`: sectie "Pending Tasks" bijwerken
- [ ] `docs/DECISIONS.md` (optioneel): datum + conclusie van de live test
- [ ] Commit met bericht: `test(email): TEST-006 afgerond, welkomstmails live bevestigd`
- [ ] Push naar main, verifieer Vercel deploy blijft groen

Bij FAIL:

- [ ] Copy Postmark error code + Vercel log excerpt in de Notities-sectie hierboven
- [ ] Admin alert in Supabase `admin_alerts` raadplegen voor `title LIKE 'Welkomstmail%'`
- [ ] Sentry event openen, stacktrace plakken in nieuw ticket
- [ ] Nieuwe KI registreren in `docs/KNOWN_ISSUES.md` met exacte symptoom en reproductie
