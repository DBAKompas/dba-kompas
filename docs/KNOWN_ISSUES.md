# KNOWN_ISSUES.md
**Bekende problemen en bugs**
**Laatst bijgewerkt:** 2026-04-07

---

## KRITIEK

### KI-001 — Fase 1 prompt te zwaar (TRUNCATION RISICO)
**Status:** OPGELOST — 2026-04-07
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `buildDbaFastAnalysisPrompt`, regels 109-248
**Symptoom:** Analyse geeft `FALLBACK_DBA_ENGINE_OUTPUT` terug ("Analyse kon niet worden voltooid")
**Oorzaak:**
Het JSON-outputschema vraagt om:
- `simulationFactState` — 18 enum/boolean velden (~200 tokens)
- `simulationHints` — array van objecten met 5 velden (~150 tokens)
- `followUpQuestions` — 3 vragen (~100 tokens)
- `additionalImprovements` — extra verbeterpunten (~20 tokens)
Totaal: kern (~600t) + zware velden (~470t) = ~1070 tokens output bij gemiddelde invoer. Bij uitgebreide invoer of lange Haiku-antwoorden: risico op truncation bij 2500 token limit. Afgekapt JSON kan niet geparsed worden → fallback.

**Fix:**
Verwijder genoemde velden uit JSON output schema in `buildDbaFastAnalysisPrompt` én verwijder de bijbehorende instructieparagrafen uit de prompttekst.

**Impact na fix:** Verwacht 0% fallback, responstijd ~3-4s.

---

### KI-002 — JSON.parse zonder try/catch in retryWithAnthropicFix
**Status:** OPGELOST — 2026-04-07
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `retryWithAnthropicFix`, regel ~431
**Symptoom:** Stille crash — wordt afgevangen door de outer try/catch maar logt als "Retry failed" i.p.v. "JSON parse error"
**Oorzaak:**
```typescript
const parsed = JSON.parse(cleanContent); // GEEN try/catch
```
Als de retry ook truncated JSON teruggeeft (bij KI-001), gooit deze regel een SyntaxError. De outer catch vangt dit op en returnt de fallback, maar:
1. De log is generiek ("Retry failed") i.p.v. specifiek
2. Als in de toekomst code na `JSON.parse` wordt toegevoegd, kan de outer catch iets anders afvangen

**Fix:**
```typescript
let parsed: unknown;
try {
  parsed = JSON.parse(cleanContent);
} catch (parseErr) {
  console.error("[DBA] Retry JSON.parse failed:", parseErr);
  return fallback;
}
```

---

## HOOG

### KI-003 — Debug endpoint publiek toegankelijk
**Status:** OPGELOST — 2026-04-07 (bestand verwijderd)
**Bestand:** `app/api/debug/ai-test/route.ts`
**Symptoom:** Iedereen kan `GET /api/debug/ai-test` aanroepen en echte Claude API calls triggeren (kosten + misbruik)
**Fix:** Bestand verwijderen zodra analyse stabiel is.

### KI-004 — Geen rate limiting op analyse endpoint
**Status:** OPGELOST — 2026-04-07 (free: 3/dag, pro: 50/dag)
**Bestand:** `app/api/dba/analyse/route.ts`
**Symptoom:** Geen limiet op het aantal analyses per gebruiker — misbruik mogelijk, kosten onbeheersbaar
**Fix:** Voeg Supabase-gebaseerde count-check toe: tel analyses van user in laatste 24u, vergelijk met plan-limiet.

---

## MIDDEL

### KI-005 — Geen tests aanwezig
**Status:** OPEN
**Impact:** Regressions worden niet automatisch gedetecteerd. Elke code-aanpassing is riskant.
**Fix:** Voeg minimaal unit tests toe voor: `validateDbaInput`, `validateDbaEngineOutput`, `buildDbaFastAnalysisPrompt` output lengte.

### KI-006 — `callAnthropicWithRetry` default model is claude-opus-4-6
**Status:** OPEN
**Bestand:** `lib/ai/dbaAnalysis.ts`, regel 356
**Impact:** Functies die geen expliciete model parameter doorgeven (bijv. `analyzeDocument`, `rewriteNewsArticle`) gebruiken onbedoeld het trage/dure Opus model.
**Fix:** Maak `model` een required parameter zonder default, of gebruik Haiku als default.

### KI-007 — Stripe webhook niet live getest
**Status:** OPEN
**Impact:** Betalingsflow kan werken in code maar falen in productie door webhook signing, endpoint URL configuratie, of idempotency edge cases.

---

## LAAG

### KI-008 — `postProcessDbaOutput` verwerkt niet-bestaande velden
**Status:** OPEN (no-op, geen bug)
**Bestand:** `lib/ai/dbaAnalysis.ts`, functie `postProcessDbaOutput`
**Impact:** Code probeert `longAssignmentDraft` en `compactAssignmentDraft` te verwerken die fase 1 niet meer levert. Dit zijn altijd no-ops maar verwarrend.

### KI-009 — Deployment configuratie ontbreekt
**Status:** OPEN
**Impact:** Geen `vercel.json` aanwezig. Deployment settings zijn ongedocumenteerd.
