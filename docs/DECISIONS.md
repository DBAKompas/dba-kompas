# DECISIONS.md
**Architectuurbeslissingen logboek**

Elke beslissing bevat: datum, beslissing, reden, alternatieven overwogen.

---

## 2026-04-07 — Overstap naar Claude Haiku

**Beslissing:** `analyzeDbaText` gebruikt `claude-haiku-4-5-20251001` in plaats van `claude-opus-4-6`

**Reden:**
- Opus 4 had een responstijd van 20+ seconden voor fase 1 analyse
- Eis: analyse binnen 10 seconden
- Haiku is ~5x sneller en voldoende nauwkeurig voor DBA signaaldetectie

**Alternatieven overwogen:**
- Claude Sonnet: sneller dan Opus maar nog steeds ~12-15s — te traag
- Streaming response: complexer en vereist UI-aanpassingen

**Impact:**
- Responstijd gedaald van 20+ naar ~5-8 seconden (zonder promptoptimalisatie)
- Haiku genereert soms afwijkend JSON (code fences, strings i.p.v. objecten) → extra sanitisatie nodig

---

## 2026-04-07 — Two-phase architectuur

**Beslissing:** Splits analyse in twee fasen:
- Fase 1: Snelle kernanalyse (risicoscore, domeinen, verbeterpunten) — synchronous, max 10s
- Fase 2: Opdrachtdraft generatie (compact + uitgebreid) — async, getriggerd na phase 1

**Reden:**
- Gebruiker wil analyse binnen 10 seconden
- Draft generatie vereist meer tokens en is minder urgent
- Betere UX: gebruiker ziet direct resultaat, draft laadt asynchroon

**Alternatieven overwogen:**
- Alles in één call: te traag (20+ seconden totaal)
- Background job queue: te complex voor huidige MVP

**Impact:**
- Analyse altijd < 10s
- Draft beschikbaar na ~15-20s (nog niet optimaal)
- Aparte API endpoint: `POST /api/dba/analyse/[id]/draft`

---

## 2026-04-07 — Nuclear/coerce validator

**Beslissing:** `validateDbaEngineOutput` en `validateDbaDraftOutput` gebruiken een "nuclear" coerce-aanpak: altijd `{ success: true }` voor geldig JSON object, met individuele veld-coercion.

**Reden:**
- Strikte Zod validatie faalde bij elke kleine afwijking van schema (Haiku is niet deterministisch)
- Elke validatiefout leidde tot FALLBACK_DBA_ENGINE_OUTPUT — onacceptabele UX
- Coerce-validator brengt altijd bruikbare data terug, ook bij gedeeltelijke output

**Alternatieven overwogen:**
- Striktere prompt-instructies: onvoldoende — Haiku is niet 100% deterministisch
- Zod `.catch()` op elk veld: zelfde effect maar meer code
- Retry-only aanpak: duurder (extra API call) en niet altijd succesvol

**Risico:**
- Velden die ontbreken worden met lege defaults gevuld — gebruiker ziet mogelijk incomplete analyse zonder foutmelding
- Mitigatie: UI toont duidelijk wanneer velden leeg zijn

---

## 2026-04-07 — Alle AI-functies naar Claude Haiku

**Beslissing:** Alle directe Anthropic API aanroepen in `dbaAnalysis.ts` gewijzigd naar `claude-haiku-4-5-20251001`. Default van `callAnthropicWithRetry` ook gewijzigd naar Haiku.

**Reden:**
- `analyzeDocument`, `rewriteDocument`, `rewriteNewsArticle`, `generateContractTemplate` gebruikten nog `claude-opus-4-6`
- Opus is ~5x trager en duurder dan Haiku
- Voor DBA-analyse en documentherschrijving is Haiku voldoende nauwkeurig

**Impact:**
- Alle AI-functies nu op Haiku — consistent en goedkoper
- `analyzeDocument` kreeg ook JSON.parse try/catch + code fence stripping (ontbrak)

---

## 2026-04-08 — Gesplitste draft generatie (compact + uitgebreid)

**Beslissing:** `buildDbaDraftGenerationPrompt` gesplitst in twee aparte functies:
- `buildCompactDraftPrompt`: genereert alleen `compactAssignmentDraft`, max_tokens 700
- `buildFullDraftPrompt`: genereert alleen `longAssignmentDraft` + `reusableBuildingBlocks`, max_tokens 1400

**Reden:**
- Gecombineerde prompt (2000 tokens) duurde ~15-20 seconden — onacceptabel voor UX
- Compact (modelovereenkomst) is het meest gebruikt — direct beschikbaar bij knopklik
- Uitgebreid (intern gebruik) is secundair — lazy laden bij eerste tab-klik is acceptabel

**Impact:**
- Compact klaar in ~3-5s (was 15-20s totaal)
- Uitgebreid beschikbaar in ~8-12s, alleen geladen wanneer gebruiker ernaar vraagt
- Draft endpoint accepteert `?mode=compact|full` query param (default: compact)
- Nuclear validator hergebruikt — ontbrekende velden worden met lege defaults gevuld

**Alternatieven overwogen:**
- Streaming: complexer, vereist UI-aanpassingen
- Parallel calls (compact + uitgebreid tegelijk): dubbele kosten voor iets wat de gebruiker nooit ziet
- Prompt optimalisatie in één call: beperkt effect — tokenbudget is fundamenteel probleem

---

## 2026-04-07 — Analyse altijd uitvoeren, follow-up vragen erna

**Beslissing:** `needs_more_input` status verwijderd. Als een tekst >= 800 tekens en >= 120 woorden heeft, wordt de analyse altijd uitgevoerd. Ontbrekende signalen worden getoond als invulvelden nádat de analyse klaar is.

**Reden:**
- Gebruiker werd gefrustreerd door blokkerende "meer informatie nodig" melding
- Analyse op basis van gedeeltelijke informatie is beter dan geen analyse
- Haiku defaultt naar "midden" bij ontbrekende informatie — acceptabel
- Follow-up vragen worden berekend via signaaldetectie (geen extra AI-aanroep)
- Gebruiker kan antwoorden invullen en heranalyseren met gecombineerde tekst

**Impact:**
- Geen `needs_more_input` responses meer
- Follow-up vragen verschijnen als invulvelden op de resultaatpagina
- "Heranalyseer" knop voegt antwoorden toe aan originele tekst en start nieuwe analyse
- Draft generatie alleen op expliciete knopklik — bespaart API kosten

---

## 2026-04-07 — Fase 1 prompt afslanken (gepland)

**Beslissing (te implementeren):** Verwijder `simulationFactState`, `simulationHints`, `followUpQuestions`, `additionalImprovements` uit fase 1 output schema.

**Reden:**
- Output budget bij 2500 max_tokens: kern (~600 tokens) + zware velden (~900 tokens) = ~1500 tokens totaal. Bij variatie in tekst bestaat truncatierisico.
- Deze velden worden NIET getoond in de huidige UI
- Fase 2 kan ze genereren indien nodig

**Verwacht effect:**
- Output daalt naar ~600 tokens
- Responstijd fase 1: ~3-4 seconden
- Truncatierisico: 0%
