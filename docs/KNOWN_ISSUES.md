# KNOWN_ISSUES.md
**Bekende problemen en bugs**
**Laatst bijgewerkt:** 2026-04-08

---

## KRITIEK

### KI-001 — Fase 1 prompt te zwaar (TRUNCATION RISICO)
**Status:** OPGELOST — 2026-04-07
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `buildDbaFastAnalysisPrompt`
**Symptoom:** Analyse geeft `FALLBACK_DBA_ENGINE_OUTPUT` terug ("Analyse kon niet worden voltooid")
**Fix:** Zware velden (`simulationFactState`, `simulationHints`, `followUpQuestions`, `additionalImprovements`) verwijderd uit fase 1 output schema.

---

### KI-002 — JSON.parse zonder try/catch in retryWithAnthropicFix
**Status:** OPGELOST — 2026-04-07
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `retryWithAnthropicFix`
**Fix:** try/catch toegevoegd rondom `JSON.parse(cleanContent)`.

---

### KI-010 — `buildFollowUpQuestions` niet geïmporteerd in dbaAnalysis.ts
**Status:** OPGELOST — 2026-04-08 (commit `92ea711`)
**Bestand:** `lib/ai/dbaAnalysis.ts`
**Symptoom:** Elke analyse gaf "Internal server error" — functie werd aangeroepen maar niet geïmporteerd.
**Fix:** `buildFollowUpQuestions` toegevoegd aan import vanuit `./inputValidation`.

---

### KI-011 — STRIPE_ONE_TIME_DBA_PRICE_ID mismatch
**Status:** OPGELOST — 2026-04-08 (commit `ae44683`)
**Bestand:** `app/api/one-time/checkout/route.ts`
**Symptoom:** One-time checkout gaf altijd HTTP 500 ("One-time purchase not configured") omdat `process.env.STRIPE_ONE_TIME_DBA_PRICE_ID` altijd `undefined` was.
**Oorzaak:** Code gebruikte `STRIPE_ONE_TIME_DBA_PRICE_ID`, maar `.env.local` en Vercel env vars gebruiken `STRIPE_PRICE_ID_ONE_TIME`.
**Fix:** `STRIPE_ONE_TIME_DBA_PRICE_ID` → `STRIPE_PRICE_ID_ONE_TIME` in route.ts.

---

## HOOG

### KI-003 — Debug endpoint publiek toegankelijk
**Status:** OPGELOST — 2026-04-07 (bestand verwijderd)
**Bestand:** `app/api/debug/ai-test/route.ts`
**Fix:** Bestand verwijderd.

---

### KI-004 — Geen rate limiting op analyse endpoint
**Status:** OPGELOST — 2026-04-07 (free: 20/dag, pro: 100/dag)
**Bestand:** `app/api/dba/analyse/route.ts`
**Fix:** Supabase-gebaseerde count-check toegevoegd.

---

### KI-007 — Stripe webhook niet live getest
**Status:** OPEN
**Impact:** Betalingsflow kan werken in code maar falen in productie door webhook signing, endpoint URL configuratie, of idempotency edge cases.
**Volgende stap:** TEST-002 en TEST-003 uitvoeren — instructies staan in PROJECT_STATE.md.

---

## MIDDEL

### KI-005 — Geen tests aanwezig
**Status:** OPEN
**Impact:** Regressions worden niet automatisch gedetecteerd. Elke code-aanpassing is riskant.
**Fix:** Voeg minimaal unit tests toe voor: `validateDbaInput`, `validateDbaEngineOutput`, `buildDbaFastAnalysisPrompt` output lengte. (QUAL-001/002 in TASKS.md)

---

### KI-006 — Alle functies gebruikten claude-opus-4-6
**Status:** OPGELOST — 2026-04-07 (commit `a976d4c`)
**Fix:** Alle aanroepen gewijzigd naar `claude-haiku-4-5-20251001`.

---

### KI-012 — `trialing` status niet als Pro herkend in getUserPlan()
**Status:** OPGELOST — 2026-04-08 (commit `ae44683`)
**Bestand:** `modules/billing/entitlements.ts`
**Symptoom:** Gebruikers in een Stripe trial werden als 'free' behandeld.
**Fix:** `subscription.status !== 'active'` uitgebreid naar `status !== 'active' && status !== 'trialing'`.

---

## LAAG

### KI-008 — `postProcessDbaOutput` verwerkt niet-bestaande velden
**Status:** OPEN (no-op, geen bug)
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `postProcessDbaOutput`
**Impact:** Code probeert `longAssignmentDraft` en `compactAssignmentDraft` te verwerken die fase 1 niet meer levert. Dit zijn altijd no-ops maar verwarrend bij codereview.
**Actie:** Geen urgentie — opruimen bij volgende grote refactor.

---

### KI-009 — Deployment configuratie ontbreekt
**Status:** OPEN
**Impact:** Geen `vercel.json` aanwezig. Deployment settings zijn ongedocumenteerd.
**Actie:** DOC-001 in TASKS.md.

---

### KI-013 — Loops deduplicatie is in-memory
**Status:** OPEN (low priority)
**Bestand:** `lib/loops/index.ts`
**Symptoom:** De `Map`-based deduplicatie reset bij elke server-herstart. Bij hoge load of serverless cold starts kunnen dubbele Loops events worden gestuurd.
**Actie:** Acceptabel voor huidige schaal. Bij problemen: Redis of Supabase-gebaseerde deduplicatie.
