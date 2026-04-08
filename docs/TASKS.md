# TASKS.md
**Laatst bijgewerkt:** 2026-04-07

---

## TODO

### HOOG (stabiliteit)

- [ ] **TEST-001**: End-to-end analyse flow testen (invoer → resultaat → follow-up vragen → heranalyse)
- [ ] **TEST-002**: Stripe betalingsflow live testen in test mode
- [ ] **TEST-003**: Stripe webhook delivery testen
- [ ] **TEST-004**: PDF download testen na voltooide analyse
- [ ] **TEST-005**: Edge case — maximale invoerlengte testen (3000+ tekens)

### MIDDEL (kwaliteit)

- [ ] **QUAL-001**: Unit tests toevoegen voor `validateDbaEngineOutput`, `validateDbaInput`
- [ ] **QUAL-002**: Integration test voor volledige analyse pipeline
- [x] **PERF-001**: Fase 2 draft generatietijd gereduceerd — compact: ~3-5s, uitgebreid: ~8-12s (lazy)
- [ ] **DOC-001**: Vercel deployment configuratie vastleggen

### LAAG (verbetering)

- [x] **FEAT-001**: Quick scan gekoppeld aan echte Haiku analyse (was keyword-based placeholder)
- [ ] **FEAT-002**: Admin panel voor contentbeheer (gidsen, nieuws)
- [ ] **FEAT-003**: Gidsen content schrijven en vullen

---

## IN PROGRESS

*(leeg)*

---

## DONE

### Sessie 2026-04-08 — PERF-001: Draft generatie gesplitst

- [x] **PERF-001**: `buildDbaDraftGenerationPrompt` gesplitst in `buildCompactDraftPrompt` (max_tokens 700) + `buildFullDraftPrompt` (max_tokens 1400)
- [x] **PERF-001**: `generateAssignmentDraft` accepteert `mode: 'compact' | 'full'` param
- [x] **PERF-001**: Draft endpoint `/api/dba/analyse/[id]/draft` accepteert `?mode=compact|full` query param
- [x] **PERF-001**: `page.tsx` — compact laadt direct bij "Genereer", uitgebreid laadt lazy bij eerste tab-klik
- [x] **DOCS**: KI-004 rate limit inconsistentie gecorrigeerd (3/dag → 20/dag)

---

### Sessie 2026-04-07 — Stabilisatie & UX

- [x] **KI-006**: Fix Opus model in `rewriteNewsArticle`, `analyzeDocument`, `rewriteDocument` → Haiku. Fix JSON.parse zonder try/catch in `analyzeDocument`.
- [x] **UX-003**: Draft generatie alleen op expliciete knopklik — auto-trigger verwijderd
- [x] **UX-002**: Follow-up vragen als invulvelden op resultaatpagina — heranalyse knop toegevoegd
- [x] **UX-001**: `needs_more_input` blokkade verwijderd — analyse altijd uitvoeren bij >= 800 tekens
- [x] **SEC-002**: Rate limiting op `/api/dba/analyse` (free: 20/dag, pro: 100/dag, enterprise: 500/dag)
- [x] **SEC-001**: Debug endpoint `/app/api/debug/ai-test/` volledig verwijderd
- [x] **FIX-002**: JSON.parse try/catch toegevoegd in `retryWithAnthropicFix`
- [x] **FIX-001**: Fase 1 prompt afgeslankt — simulationFactState, simulationHints, followUpQuestions, additionalImprovements verwijderd
- [x] **ARCH-TWO-PHASE**: Two-phase architectuur (fase 1 snelle analyse, fase 2 async draft)
- [x] **PERF-HAIKU**: Overstap van `claude-opus-4-6` naar `claude-haiku-4-5-20251001` voor hoofdanalyse
- [x] **FIX-CODEFENCE**: Code fence stripping + outermost `{...}` extractie
- [x] **FIX-HINTS**: `simulationHints` Zod coercion
- [x] **FIX-NUCLEAR**: Nuclear/coerce validator voor `validateDbaEngineOutput` + `validateDbaDraftOutput`
- [x] **FEAT-DRAFT-API**: Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft`)
- [x] **UI-REDESIGN**: Premium UI resultaatpagina (hero banner, 3-koloms domeinen, actiepunten)
- [x] **UI-FALLBACK**: isFallback-check + eigen foutscherm
