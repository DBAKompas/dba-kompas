# TEST-006 — Welkomstmail end-to-end (Postmark + KI-020-A activate-flow)

**Doel:** volledige keten valideren vanaf guest-email checkout tot dashboard-toegang:
`/api/billing/checkout-guest (of /api/one-time/checkout-guest) → Stripe live checkout → checkout.session.completed → provisionUserForCheckout → sendPurchaseWelcomeEmail → Postmark template met {{ activate_link }} + {{ login_link }} → inbox → /auth/activate/<token> (primair) → wachtwoord instellen → dashboard` plus eenmalig het magic-link fallback-pad `/auth/welcome/<token> → generateLink(magiclink) → dashboard`.

Na succes worden KI-019, KI-020 en KI-020-A gesloten en TEST-006 op DONE gezet.

**Uitvoerder:** Marvin
**Startdatum uitvoering:** YYYY-MM-DD
**Einddatum uitvoering:** YYYY-MM-DD
**Eindstatus:** [ ] PASS [ ] FAIL [ ] PARTIAL

---

## Preflight checks

### A1 — Postmark

- [x] Server status: Approved (2026-04-20, smoke test geslaagd)
- [x] Stream `outbound` actief
- [x] Template alias `welkomstmail-eenmalig` bestaat en is published
- [x] Template alias `welkomstmail-maand` bestaat en is published
- [x] Template alias `welkomstmail-jaar` bestaat en is published
- [x] Sender signature `noreply@dbakompas.nl` geverifieerd
- [x] DKIM `dbakompas.nl` groen
- [x] Return-Path `dbakompas.nl` groen
- [ ] **Templates bijgewerkt voor KI-020-A** (handmatig door Marvin vóór B1/B2/B3):
  - [ ] `welkomstmail-eenmalig` — primaire CTA-knop → `{{ activate_link }}` ("Activeer je account en zie het aanbod"), secundaire tekst-link → `{{ login_link }}` ("Liever direct inloggen zonder wachtwoord? Klik hier."), huisstijl (logo `https://dbakompas.nl/logo-white-v3-full.png`, bg #0F1A2E, accent #F5A14C), upgrade-uitleg ("Je vindt dit aanbod terug in je dashboard onder Upgraden")
  - [ ] `welkomstmail-maand` — primaire CTA → `{{ activate_link }}`, secundair → `{{ login_link }}`, zelfde huisstijl
  - [ ] `welkomstmail-jaar` — primaire CTA → `{{ activate_link }}`, secundair → `{{ login_link }}`, zelfde huisstijl
  - [ ] TemplateModel-variabelen verwacht per template: `activate_link`, `login_link`

### A2 — Vercel

- [x] `POSTMARK_SERVER_TOKEN` aanwezig in Production env
- [x] `STRIPE_WEBHOOK_SECRET` aanwezig in Production env
- [x] `SENTRY_DSN` aanwezig in Production env (voor observability)
- [x] `ADMIN_ALERT_EMAIL` aanwezig in Production env (fallback is marvinzoetemelk@gmail.com)
- [x] `WELCOME_TOKEN_SECRET` aanwezig in Production env (min 32 random chars; toegevoegd 2026-04-20)
- [x] Laatste deployment succesvol (commit `e77f9e7` op main)

### A4 — Supabase

- [x] Migration `006_welcome_tokens.sql` uitgevoerd in Supabase Studio (2026-04-20, Success, 0 rows)
- [x] RLS aan op `public.welcome_tokens` (geen policies: uitsluitend service-role toegang)

### A3 — Stripe live mode

- [ ] Endpoint `https://dbakompas.nl/api/billing/webhook` bestaat
- [ ] Events aangevinkt: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- [ ] Signing secret in Vercel matcht endpoint secret in Stripe dashboard
- [ ] Recent deliveries toont 2xx responses (geen 4xx/5xx backlog)

---

## Test B1 — one_time (activate-flow, primair pad)

**Testaccount:** `marvinzoetemelk+dbatest1@gmail.com`
**Timestamp start:** __________
**Timestamp aankoop:** __________

### Uitvoer

- [ ] Op dbakompas.nl: guest-email checkout gestart (alleen e-mail + terms, geen wachtwoord vooraf)
- [ ] One-time aankoop voltooid via live Stripe checkout
- [ ] Stripe dashboard toont PaymentIntent status `succeeded`
- [ ] Geen Supabase auth signup mail zichtbaar (alleen welkomstmail)

### Verificatie welkomstmail

- [ ] Welkomstmail in inbox binnen 60s
- [ ] From: `DBA Kompas <noreply@dbakompas.nl>`
- [ ] Inhoud klopt met `welkomstmail-eenmalig` copy (geen placeholders, logo zichtbaar, huisstijl klopt)
- [ ] Primaire CTA-knop linkt naar `https://dbakompas.nl/auth/activate/<token>`
- [ ] Secundaire tekst-link linkt naar `https://dbakompas.nl/auth/welcome/<token>`
- [ ] Postmark Activity: status `Delivered`, template `welkomstmail-eenmalig`, stream `outbound`

### Verificatie activate-flow

- [ ] Klik op primaire CTA → pagina `/auth/activate/<token>` laadt zonder error
- [ ] Wachtwoord invullen (min 10 tekens, hoofdletter, kleine letter, cijfer, speciaal teken) → submit
- [ ] Server action voltooit en redirect naar `/dashboard`
- [ ] Sessie actief (gebruiker ziet dashboard content, niet /login)
- [ ] Supabase `welcome_tokens` rij heeft `used_at` gezet, `used_purpose = 'activate'`, `used_ip` ingevuld

### Verificatie back-end

- [ ] Vercel Logs `/api/billing/webhook` → 200, geen `handleWelcomeMailFailure` entries
- [ ] Supabase `billing_events`: 1 nieuwe rij, `event_type = 'checkout.session.completed'`
- [ ] Supabase `profiles`: nieuwe rij met juiste e-mail
- [ ] Supabase `one_time_purchases`: 1 nieuwe rij
- [ ] Supabase `admin_alerts`: geen nieuwe rij voor deze run
- [ ] Sentry: geen nieuw event met tag `area=welcome_email`

**Uitkomst:** [ ] PASS [ ] FAIL
**Bewijs (Postmark message-id):** __________
**Notities:** __________

---

## Test B2 — monthly (magic-link fallback pad)

**Testaccount:** `marvinzoetemelk+dbatest2@gmail.com`
**Timestamp start:** __________
**Timestamp aankoop:** __________

### Uitvoer

- [ ] Op dbakompas.nl: guest-email checkout gestart
- [ ] Maandelijks abonnement afgesloten via live Stripe checkout
- [ ] Stripe dashboard toont Subscription status `active` of `trialing`

### Verificatie welkomstmail

- [ ] Welkomstmail in inbox binnen 60s
- [ ] From: `DBA Kompas <noreply@dbakompas.nl>`
- [ ] Inhoud klopt met `welkomstmail-maand` copy (logo + huisstijl)
- [ ] Primaire CTA-knop linkt naar `/auth/activate/<token>`
- [ ] Secundaire tekst-link linkt naar `/auth/welcome/<token>`
- [ ] Postmark Activity: status `Delivered`, template `welkomstmail-maand`

### Verificatie magic-link fallback (bewust pad voor deze test)

- [ ] Klik op secundaire tekst-link → pagina `/auth/welcome/<token>` laadt
- [ ] Knop "Direct inloggen zonder wachtwoord" indrukken → server action genereert verse Supabase magic-link
- [ ] Supabase verify-URL redirect → dashboard
- [ ] Sessie actief zonder wachtwoord in te vullen
- [ ] Supabase `welcome_tokens` rij heeft `used_at` gezet, `used_purpose = 'magiclink'`

### Verificatie back-end

- [ ] Vercel Logs → 200, geen welkomstmail-fouten
- [ ] Supabase `billing_events`: nieuwe rij `checkout.session.completed` én vervolg-event voor subscription
- [ ] Supabase `subscriptions`: nieuwe rij met `plan = monthly`, correcte `current_period_end`
- [ ] Supabase `admin_alerts`: geen nieuwe rij
- [ ] Sentry: geen nieuw event

**Uitkomst:** [ ] PASS [ ] FAIL
**Bewijs (Postmark message-id):** __________
**Notities:** __________

---

## Test B3 — yearly (activate-flow, primair pad)

**Testaccount:** `marvinzoetemelk+dbatest3@gmail.com`
**Timestamp start:** __________
**Timestamp aankoop:** __________

### Uitvoer

- [ ] Op dbakompas.nl: guest-email checkout gestart
- [ ] Jaarabonnement afgesloten via live Stripe checkout
- [ ] Stripe dashboard toont Subscription status `active` of `trialing`

### Verificatie welkomstmail

- [ ] Welkomstmail in inbox binnen 60s
- [ ] From: `DBA Kompas <noreply@dbakompas.nl>`
- [ ] Inhoud klopt met `welkomstmail-jaar` copy (logo + huisstijl)
- [ ] Primaire CTA-knop linkt naar `/auth/activate/<token>`
- [ ] Postmark Activity: status `Delivered`, template `welkomstmail-jaar`

### Verificatie activate-flow

- [ ] Klik op primaire CTA → pagina `/auth/activate/<token>` laadt
- [ ] Wachtwoord invullen (min 10 tekens, hoofdletter, kleine letter, cijfer, speciaal teken) → submit
- [ ] Server action voltooit en redirect naar `/dashboard`
- [ ] Sessie actief
- [ ] Supabase `welcome_tokens` rij heeft `used_at` gezet, `used_purpose = 'activate'`

### Verificatie back-end

- [ ] Vercel Logs → 200, geen welkomstmail-fouten
- [ ] Supabase `billing_events`: nieuwe rij
- [ ] Supabase `subscriptions`: nieuwe rij met `plan = yearly`
- [ ] Supabase `admin_alerts`: geen nieuwe rij
- [ ] Sentry: geen nieuw event

**Uitkomst:** [ ] PASS [ ] FAIL
**Bewijs (Postmark message-id):** __________
**Notities:** __________

---

## Test B4 — Gmail prefetch-defense (KI-020-A regressie)

**Doel:** bewijzen dat Gmail's SafeBrowsing-prefetcher de tokens niet meer verbruikt.

- [ ] Open één van de welkomstmails uit B1/B2/B3 in een Gmail-account waarvan bekend is dat SafeBrowsing actief is
- [ ] Laat de mail 30-60 seconden ongeklikt staan (kans op prefetch)
- [ ] Klik vervolgens de primaire CTA en volg het activate-pad
- [ ] Activatie slaagt (geen `otp_expired`, geen redirect naar `/login`)
- [ ] `welcome_tokens` rij voor dit token heeft pas `used_at` op het moment van de klik, niet eerder

**Uitkomst:** [ ] PASS [ ] FAIL
**Notities:** __________

---

## Nazorg

- [ ] Drie test-betalingen gerefund via Stripe dashboard (Payments → refund)
- [ ] Drie testaccounts gedeactiveerd of verwijderd uit Supabase Auth (optioneel)
- [ ] Referral-tracking rows van testaccounts opgeruimd indien nodig
- [ ] Admin alerts van voortijdige fouten opgelost of op `resolved` gezet

---

## Afsluiting

Bij 3x PASS + B4 PASS:

- [ ] `docs/TASKS.md`: TEST-006 + KI-020 + KI-020-A naar DONE verplaatsen, mijlpaal-notitie toevoegen
- [ ] `docs/KNOWN_ISSUES.md`: KI-019 + KI-020 + KI-020-A status → OPGELOST, datum toevoegen
- [ ] `docs/PROJECT_STATE.md`: "Pending Tasks" + "LAATSTE ACTIE" + "VOLGENDE GEPLANDE STAP" bijwerken
- [ ] `docs/DECISIONS.md`: KI-020-A entry afsluiten met live-test conclusie (datum + resultaat)
- [ ] Commit met bericht: `test(email): TEST-006 afgerond, KI-020 + KI-020-A live bevestigd`
- [ ] Push naar main, verifieer Vercel deploy blijft groen

Bij FAIL:

- [ ] Copy Postmark error code + Vercel log excerpt in de Notities-sectie hierboven
- [ ] Admin alert in Supabase `admin_alerts` raadplegen voor `title LIKE 'Welkomstmail%'`
- [ ] Sentry event openen, stacktrace plakken in nieuw ticket
- [ ] Nieuwe KI registreren in `docs/KNOWN_ISSUES.md` met exacte symptoom en reproductie
