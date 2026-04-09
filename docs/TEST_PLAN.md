# TEST_PLAN.md
**Testplan voor DBA Kompas**
**Laatst bijgewerkt:** 2026-04-09

---

## SCENARIO 1 — Basis analyse flow (KRITIEK)

**Doel:** Verifieer dat een geldige opdrachtomschrijving een volledige analyse produceert zonder fallback.

**Stappen:**
1. Log in als testgebruiker
2. Navigeer naar `/analyse`
3. Plak een opdrachtomschrijving van minimaal 800 tekens en 120 woorden
4. Klik op "Analyseer"
5. Wacht maximaal 10 seconden

**Expected outcome:**
- HTTP 200 van `/api/dba/analyse`
- Response bevat: `analysisStatus: "complete"`, `overallRiskLabel`, 3 domeinen, `topImprovements`
- Redirect naar `/analyse/[id]`
- Resultaatpagina toont: hero banner met risicoscore, 3 domeinkaarten, actiepunten
- GEEN foutscherm "Analyse kon niet worden voltooid"

**Faalcriteria:**
- `is_fallback: true` in response
- Responstijd > 10 seconden
- Minder dan 3 domeinen in response

---

## SCENARIO 2 — Opdrachtdraft generatie (fase 2)

**Doel:** Verifieer dat de compacte opdrachtdraft asynchroon wordt gegenereerd.

**Stappen:**
1. Voltooi Scenario 1
2. Op de resultaatpagina: wacht op de spinner bij "Opdrachtomschrijving"
3. Wacht maximaal 25 seconden

**Expected outcome:**
- Spinner verdwijnt
- Compacte opdrachtdraft zichtbaar met: titel, omschrijving, opleveringen
- Tekst is begrijpelijk Nederlands
- Geen JSON-rommel zichtbaar
- Geen "Draft kon niet worden gegenereerd" fallback

---

## SCENARIO 3 — Te korte invoer

**Doel:** Verifieer dat onvoldoende invoer correct wordt geweigerd.

**Stappen:**
1. Navigeer naar `/analyse`
2. Plak een tekst van minder dan 800 tekens (bijv. 200 tekens)
3. Klik op "Analyseer"

**Expected outcome:**
- Response bevat `status: "insufficient_input"`
- Gebruiker ziet een duidelijke melding (geen analyse gestart)
- Geen AI-aanroep gedaan

---

## SCENARIO 4 — Grenswaarde invoer

**Doel:** Verifieer dat invoer van precies 800-900 tekens correct verwerkt wordt.

**Stappen:**
1. Plak tekst van exact 820 tekens
2. Klik op "Analyseer"

**Expected outcome:**
- Analyse start (geen `insufficient_input`)
- Mogelijke `needs_more_input` als kwaliteitssignalen ontbreken

---

## SCENARIO 5 — Maximale invoer

**Doel:** Verifieer dat uitgebreide invoer (3000+ tekens) geen truncatie veroorzaakt.

**Stappen:**
1. Plak een opdrachtomschrijving van 3000+ tekens
2. Analyseer
3. Controleer in server logs: `[DBA] raw response length:`

**Expected outcome:**
- Analyse succesvol
- Raw response length > 500 chars
- Geen "Failed to parse JSON" in logs
- Responstijd < 10 seconden

---

## SCENARIO 6 — Debug endpoint (security check)

**Doel:** Verifieer dat het debug endpoint verwijderd is.

**Stappen:**
1. Roep `GET /api/debug/ai-test` aan (zonder authenticatie)

**Expected outcome:**
- HTTP 404 (endpoint bestaat niet meer)

---

## SCENARIO 7 — Stripe betalingsflow (subscription)

**Doel:** Verifieer end-to-end betalingsflow in Stripe test mode.

**Stappen:**
1. Log in als niet-betaalde testgebruiker
2. Probeer extra analyse (als limiet bereikt)
3. Klik op upgrade knop
4. Stripe Checkout opent
5. Gebruik Stripe testkaart `4242 4242 4242 4242`
6. Voltooi betaling

**Expected outcome:**
- Redirect terug naar applicatie
- Stripe webhook ontvangen (check Stripe Dashboard)
- `subscriptions` tabel bijgewerkt: `status: "active"`
- Gebruiker kan nu analyseren

---

## SCENARIO 8 — PDF download

**Doel:** Verifieer PDF rapport generatie.

**Stappen:**
1. Open een voltooide analyse
2. Klik op "Rapport downloaden"

**Expected outcome:**
- PDF download start
- PDF bevat: risicoscore, 3 domeinen, verbeterpunten, disclaimer
- PDF is leesbaar en correct opgemaakt

---

## SCENARIO 9 — Auth flow

**Doel:** Verifieer authenticatie en sessies.

**Stappen:**
1. Registreer nieuwe gebruiker met e-mail
2. Verifieer e-mail (indien verplicht)
3. Log in
4. Ververs pagina — sessie blijft actief
5. Log uit
6. Verifieer redirect naar `/login`

**Expected outcome:**
- Alle stappen werken zonder fouten
- Beschermde routes (`/dashboard`, `/analyse`) redirect naar login bij uitgelogd

---

---

## SCENARIO 10 — Paywall: free gebruiker geblokkeerd

**Doel:** Verifieer dat een ingelogde gebruiker zonder betaling niet bij het dashboard kan komen.

**Stappen:**
1. Maak een nieuw account aan (geen betaling doen)
2. Log in
3. Probeer te navigeren naar `/dashboard`

**Expected outcome:**
- Redirect naar `/upgrade`
- Paywallpagina toont 3 plankaarten (Eenmalig €9,95 / Maandelijks €20 / Jaarlijks €200)
- Geen dashboard content zichtbaar

**Extra check:**
- Probeer `/analyse` en `/nieuws` direct — ook redirect naar `/upgrade`
- Probeer `/profiel` — wél toegankelijk (paywall-exempt)

---

## SCENARIO 11 — Paywall: betalende gebruiker heeft toegang

**Doel:** Verifieer dat een gebruiker met actief abonnement of one-time purchase het dashboard kan bereiken.

**Stappen:**
1. Log in als gebruiker met actief abonnement (subscription status `active` of `trialing`)
2. Navigeer naar `/dashboard`

**Expected outcome:**
- Geen redirect naar `/upgrade`
- Dashboard laadt normaal

**Varianten:**
- Gebruiker met `subscriptions.status = 'active'` → toegang
- Gebruiker met `subscriptions.status = 'trialing'` → toegang
- Gebruiker met `one_time_purchases.status = 'purchased'` → toegang
- Gebruiker zonder betaling → redirect naar `/upgrade`

---

## SCENARIO 12 — Stripe webhook delivery (TEST-003)

**Doel:** Verifieer dat Stripe webhooks correct worden ontvangen en verwerkt.

**Voorbereiding:**
1. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`
2. Kopieer `whsec_...` signing secret uit CLI output
3. Zet als `STRIPE_WEBHOOK_SECRET` in `.env.local`
4. Start dev server: `npm run dev`

**Stappen:**
1. Trigger: `stripe trigger checkout.session.completed`
2. Controleer server logs: geen errors

**Expected outcome:**
- HTTP 200 response van webhook endpoint
- Nieuw record in `billing_events` tabel (Supabase)
- Geen duplicate event als dezelfde trigger nogmaals gedaan wordt (idempotency check)

**Extra trigger (subscription):**
- `stripe trigger customer.subscription.updated`
- Verwacht: `subscriptions` tabel bijgewerkt in Supabase

---

## SCENARIO 13 — One-time upsell e-mail

**Doel:** Verifieer dat de upsell e-mail verstuurd wordt na een one-time aankoop.

**Stappen:**
1. Voer een one-time checkout uit (Stripe test mode, product type `one_time_dba`)
2. Stripe webhook `checkout.session.completed` (mode=payment) wordt getriggerd
3. Controleer e-mailinbox van testgebruiker

**Expected outcome:**
- E-mail ontvangen met subject "Je DBA-check is klaar — upgrade voor €10,05 eerste maand"
- E-mail bevat groene kortingsbox + knop "Upgrade voor €10,05 eerste maand"
- Knop linkt naar `/upgrade-to-pro`

**Faalcriteria:**
- Geen e-mail ontvangen (controleer Resend dashboard voor errors)
- E-mail verstuurd maar knop linkt naar verkeerde URL

---

## SCENARIO 14 — Upgrade-to-pro met coupon

**Doel:** Verifieer dat de upgrade flow de Stripe coupon correct toepast.

**Vereisten:**
- Gebruiker heeft `one_time_purchases` rij met `status = 'purchased'`
- `STRIPE_COUPON_ONE_TIME_UPGRADE` env var ingesteld (bijv. `ONETIMECREDIT`)

**Stappen:**
1. Log in als gebruiker met one-time purchase
2. Navigeer naar `/upgrade-to-pro`
3. Stripe Checkout opent

**Expected outcome:**
- Stripe Checkout toont: "Korting: -€9,95" (of vergelijkbare coupon-weergave)
- Totaal eerste betaling: €10,05 (€20 − €9,95)
- Na betaling: redirect naar `/dashboard?session_id=...`
- Nieuwe rij in `subscriptions` tabel

**Conflict check:**
- Navigeer naar `/upgrade-to-pro` als gebruiker al een actief abonnement heeft
- Expected: redirect naar `/dashboard` (geen Stripe checkout geopend)

---

## SCENARIO 15 — Conversie-funnel (end-to-end)

**Doel:** Verifieer de volledige nieuwe gebruiker conversie-flow.

**Stappen:**
1. Open incognito venster → ga naar homepage
2. Klik op een plan → `EmailCheckoutModal` opent
3. Stap 1: plan bevestigen → "Doorgaan"
4. Stap 2: e-mail + wachtwoord invullen + akkoord aanvinken → "Account aanmaken & betalen"
   - Als e-mailbevestiging UIT: modal sluit, Stripe checkout opent direct
   - Als e-mailbevestiging AAN: modal toont "Controleer je e-mail" scherm → verificatiemail → klikken → `/checkout-redirect` → Stripe
5. Stripe Checkout: testkaart `4242 4242 4242 4242`
6. Na betaling: `/dashboard?session_id=...`

**Expected outcome:**
- Groene "Abonnement geactiveerd!" banner op dashboard
- Gebruiker aanwezig in Supabase Auth tabel
- Gebruiker aanwezig in `subscriptions` tabel (na webhook, TEST-003)
- Geen 404 of redirect naar verkeerde pagina in het hele proces

---

## EDGE CASES

| Case | Verwacht gedrag |
|---|---|
| Analyse zonder internet (Anthropic timeout) | Fallback response, foutmelding in UI |
| Analyse met alleen emoji's of cijfers | `insufficient_input` of lage kwaliteitsscore |
| Dubbele analyse indienen | Tweede aanroep werkt normaal |
| Analyse tijdens lage Haiku capaciteit | Retry mechanisme actief, max 2 pogingen |
| Stripe webhook dubbel ontvangen | Idempotency check voorkomt dubbele verwerking |
| Gebruiker met actief abonnement klikt `/upgrade-to-pro` | Redirect naar `/dashboard` (geen dubbel abonnement) |
| Gebruiker zonder one-time purchase klikt `/upgrade-to-pro` | Checkout zonder coupon (reguliere €20/maand) |
| `STRIPE_COUPON_ONE_TIME_UPGRADE` env var ontbreekt | Checkout zonder coupon — geen fout (coupon optioneel) |
