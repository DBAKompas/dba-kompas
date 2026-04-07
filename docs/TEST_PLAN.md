# TEST_PLAN.md
**Testplan voor DBA Kompas**
**Laatst bijgewerkt:** 2026-04-07

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

## EDGE CASES

| Case | Verwacht gedrag |
|---|---|
| Analyse zonder internet (Anthropic timeout) | Fallback response, foutmelding in UI |
| Analyse met alleen emoji's of cijfers | `insufficient_input` of lage kwaliteitsscore |
| Dubbele analyse indienen | Tweede aanroep werkt normaal |
| Analyse tijdens lage Haiku capaciteit | Retry mechanisme actief, max 2 pogingen |
| Stripe webhook dubbel ontvangen | Idempotency check voorkomt dubbele verwerking |
