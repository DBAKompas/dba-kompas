# TASKS.md
**Laatst bijgewerkt:** 2026-04-07

---

## TODO

### KRITIEK (blokkeren productie)

- [ ] **FIX-001**: Slan fase 1 prompt af — verwijder simulationFactState, simulationHints, followUpQuestions, additionalImprovements uit `buildDbaFastAnalysisPrompt` in `lib/ai/dbaAnalysis.ts`
  - Doel: output < 800 tokens, elimineer truncation-risico
  - Verwacht resultaat: 0% fallback errors, <5s responstijd

- [ ] **FIX-002**: Fix JSON.parse crash in `retryWithAnthropicFix` (`lib/ai/dbaAnalysis.ts` regel ~431)
  - Voeg try/catch toe, vang parse error op en return fallback

- [ ] **SEC-001**: Verwijder debug endpoint `/app/api/debug/ai-test/route.ts`
  - Publiek toegankelijk, maakt echte AI-aanroepen zonder auth

- [ ] **SEC-002**: Voeg rate limiting toe op `/api/dba/analyse`
  - Maximaal N aanroepen per gebruiker per dag op basis van plan

### HOOG (stabiliteit)

- [ ] **TEST-001**: End-to-end analyse flow testen (invoer → resultaat → draft)
- [ ] **TEST-002**: Stripe betalingsflow live testen in test mode
- [ ] **TEST-003**: Stripe webhook delivery testen
- [ ] **TEST-004**: PDF download testen na voltooide analyse
- [ ] **TEST-005**: Edge case — maximale invoerlengte testen (3000+ tekens)

### MIDDEL (kwaliteit)

- [ ] **QUAL-001**: Unit tests toevoegen voor `validateDbaEngineOutput`, `validateDbaInput`
- [ ] **QUAL-002**: Integration test voor volledige analyse pipeline
- [ ] **PERF-001**: Fase 2 draft generatietijd reduceren (huidig ~15-20s)
- [ ] **DOC-001**: Vercel deployment configuratie vastleggen

### LAAG (verbetering)

- [ ] **FEAT-001**: Quick scan koppelen aan echte Claude analyse (nu keyword-based)
- [ ] **FEAT-002**: Admin panel voor contentbeheer (gidsen, nieuws)
- [ ] **FEAT-003**: Gidsen content schrijven en vullen
- [ ] **ARCH-001**: `callAnthropicWithRetry` default model vervangen door expliciete required parameter

---

## IN PROGRESS

*(leeg)*

---

## DONE (deze sessie — 2026-04-07)

- [x] **FIX-001**: Fase 1 prompt afgeslankt — simulationFactState, simulationHints, followUpQuestions, additionalImprovements verwijderd uit `buildDbaFastAnalysisPrompt`
- [x] **FIX-002**: JSON.parse try/catch toegevoegd in `retryWithAnthropicFix` — stille crash opgelost
- [x] **SEC-001**: Debug endpoint `/app/api/debug/ai-test/` volledig verwijderd
- [x] **SEC-002**: Rate limiting toegevoegd op `/api/dba/analyse` (free: 3/dag, pro: 50/dag, enterprise: 500/dag)
- [x] **ARCH-001**: Two-phase architectuur geïmplementeerd (fase 1 snelle analyse, fase 2 async draft)
- [x] **PERF-001**: Overstap van `claude-opus-4-6` naar `claude-haiku-4-5-20251001` voor analyse
- [x] **FIX-003**: Code fence stripping (Haiku wrappet JSON in ```json...```)
- [x] **FIX-004**: Outermost `{...}` extractie via regex voor verpakt JSON
- [x] **FIX-005**: `simulationHints` Zod coercion (Haiku stuurde strings i.p.v. objecten)
- [x] **FIX-006**: Nuclear/coerce validator voor `validateDbaEngineOutput`
- [x] **FIX-007**: Nuclear/coerce validator voor `validateDbaDraftOutput`
- [x] **FEAT-004**: Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft`)
- [x] **UI-001**: Premium UI redesign resultaatpagina (colored hero, 3-koloms domeinkaarten, actiepunten)
- [x] **UI-002**: isFallback-check + eigen foutscherm bij FALLBACK_DBA_ENGINE_OUTPUT
- [x] **UI-003**: Auto-trigger fase 2 vanuit resultaatpagina als draft null is
