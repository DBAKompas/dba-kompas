# TASKS.md
**Laatst bijgewerkt:** 2026-04-08

---

## TODO

### HOOG (stabiliteit)

- [ ] **TEST-002**: Stripe betalingsflow live testen in test mode
  - Vereist: Stripe test-keys in Vercel env vars
  - Vereist: Deploy na commit `ae44683`
  - Verwacht: groen succesbericht op dashboard, `subscriptions` tabel gevuld
- [ ] **TEST-003**: Stripe webhook delivery testen
  - Vereist: `stripe listen --forward-to localhost:3000/api/billing/webhook` (Stripe CLI)
  - Vereist: `whsec_...` signing secret uit CLI als `STRIPE_WEBHOOK_SECRET` in `.env.local`
  - Trigger: `stripe trigger checkout.session.completed`
  - Controleer: `billing_events` + `subscriptions` tabel in Supabase
- [ ] **TEST-005**: Edge case — maximale invoerlengte testen (3000+ tekens)

### MIDDEL (kwaliteit)

- [ ] **QUAL-001**: Unit tests toevoegen voor `validateDbaEngineOutput`, `validateDbaInput`
- [ ] **QUAL-002**: Integration test voor volledige analyse pipeline
- [ ] **DOC-001**: Vercel deployment configuratie vastleggen (`vercel.json` + env vars documenteren)

### LAAG (verbetering)

- [ ] **LOOPS-002**: Custom contactvelden instellen in Loops dashboard
  - Vereist: handmatige actie in Loops dashboard (geen code)
  - Velden: `quick_scan_completed` (boolean), `quick_scan_risk_level` (string), `quick_scan_score` (number)
  - E-mailsequentie koppelen aan `quick_scan_completed` event
- [ ] **FEAT-002**: Admin panel voor contentbeheer (gidsen, nieuws)
- [ ] **FEAT-003**: Gidsen content schrijven en vullen

---

## IN PROGRESS

*(leeg)*

---

## DONE

### Sessie 2026-04-08 — Stripe fixes + Loops quick-scan + PDF

- [x] **FIX-010**: `buildFollowUpQuestions` import ontbrak in `dbaAnalysis.ts` → elke analyse gaf "Internal server error" (commit `92ea711`)
- [x] **FIX-011**: `STRIPE_ONE_TIME_DBA_PRICE_ID` → `STRIPE_PRICE_ID_ONE_TIME` in `app/api/one-time/checkout/route.ts` — was kritieke mismatch met `.env.local` waardoor one-time checkout altijd 500 gaf (commit `ae44683`)
- [x] **FIX-012**: `trialing` status telt nu als actief Pro-plan in `modules/billing/entitlements.ts` (commit `ae44683`)
- [x] **UX-004**: Dashboard succesbericht na geslaagde betaling — detecteert `?session_id=` URL param, cleant URL daarna (commit `ae44683`)
- [x] **FIX-PDF-001**: PDF kon niet renderen — pdfkit toegevoegd aan `serverExternalPackages` in `next.config.ts` (commit `b1569d3`)
- [x] **FIX-PDF-002**: PDF toonde ruwe JSON i.p.v. leesbare tekst — parseDraftJson helpers toegevoegd (commit `910ce2d`)
- [x] **FIX-PDF-003**: Domeinnamen toonden "Domein" — gebruik `d.title ?? d.domainName ?? d.key` (commit `a8c4268`)
- [x] **FIX-PDF-004**: Logo niet gevonden — `dba-kompas-logo.png` → `logo-flat-white.png` (commit `a8c4268`)
- [x] **FIX-PDF-005**: Full draft truncated bij max_tokens 1400 — verhoogd naar 2000 (commit `a8c4268`)
- [x] **REFACTOR-PDF**: Volledige PDF redesign — cream achtergrond alle pagina's, exacte underlines, inline score, `truncateSentence()`, `renderDraftCol()` helper, `autoFirstPage: false` (commit `a5bff30`)
- [x] **LOOPS-001**: `/api/loops/quick-scan` endpoint gebouwd — contact aanmaken/updaten + `quick_scan_completed` event sturen (commit `7c13cc5`)
- [x] **UX-005**: Quick scan success screen — "Ga verder" → `/auth/signup`, "Bekijk wat DBA Kompas biedt" → `/#pricing` (commit `7c13cc5`)
- [x] **TEST-001**: End-to-end analyse flow getest — werkt stabiel na import-fix
- [x] **TEST-004**: PDF download getest — werkt correct na alle PDF fixes

---

### Sessie 2026-04-08 — PERF-001: Draft generatie gesplitst

- [x] **PERF-001**: `buildDbaDraftGenerationPrompt` gesplitst in `buildCompactDraftPrompt` (max_tokens 700) + `buildFullDraftPrompt` (max_tokens 2000)
- [x] **PERF-001**: `generateAssignmentDraft` accepteert `mode: 'compact' | 'full'` param
- [x] **PERF-001**: Draft endpoint `/api/dba/analyse/[id]/draft` accepteert `?mode=compact|full` query param
- [x] **PERF-001**: `page.tsx` — compact laadt direct bij "Genereer", uitgebreid laadt lazy bij eerste tab-klik
- [x] **DOCS**: KI-004 rate limit inconsistentie gecorrigeerd (3/dag → 20/dag)

---

### Sessie 2026-04-07 — Stabilisatie & UX

- [x] **KI-006**: Fix Opus model in `rewriteNewsArticle`, `analyzeDocument`, `rewriteDocument` → Haiku
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
- [x] **FIX-NUCLEAR**: Nuclear/coerce validator voor `validateDbaEngineOutput` + `validateDbaDraftOutput`
- [x] **FEAT-DRAFT-API**: Fase 2 draft API endpoint (`POST /api/dba/analyse/[id]/draft`)
- [x] **UI-REDESIGN**: Premium UI resultaatpagina (hero banner, 3-koloms domeinen, actiepunten)
- [x] **UI-FALLBACK**: isFallback-check + eigen foutscherm
