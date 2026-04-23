# PLAN — Control Tower Gebruikerslijst met filters en extra kolommen

**Aangemaakt:** 2026-04-23 (sessie 25)
**Status:** Plan, nog niet geïmplementeerd. Klaar voor uitvoering in verse sessie.
**Eigenaar:** Marvin / Claude
**Gekoppelde pagina:** `/admin/gebruikers` (admin-only)
**Plandocumentconventie:** volgt respond-order uit CODING_STANDARDS

---

## 1. Scope

De admin-pagina `/admin/gebruikers` toont nu een platte lijst met e-mail, plan, rol, aangemaaktdatum en een reset-mail-knop. Dat werkt nog, maar schaalt slecht zodra er honderden gebruikers zijn.

Doel: de lijst uitbreiden met extra kolommen en filter/sorteer/zoek-mogelijkheden zodat Marvin gericht kan analyseren wie actief is, wie terugkomt, wie vervalt en welke plan-mix hij draait.

Out of scope voor deze plan-uitvoering: bulk-acties (mail allen, export) behalve CSV-export (zie §10 extra's).

---

## 2. Architecture impact

Geen nieuwe structurele patronen. We blijven binnen de bestaande opzet:

- Data-aggregatie in de API-route (`app/api/admin/gebruikers/route.ts`) achter `requireAdmin()` + `supabaseAdmin` (service-role). Geen RLS-omzeiling; admin-check blijft autorisatiepoort.
- Plan-resolutie hergebruikt de in sessie 25 geharmoniseerde `getQuotaPlansForUsers` uit `modules/billing/entitlements.ts`.
- Nieuwe aggregaties (aantal analyses, laatste analyse, laatste nieuws-read) worden óók batched, dus geen N+1.
- UI-filtering primair client-side voor de eerste iteratie (dataset verwacht <500 users). Bij groei migreren naar server-side paging + filtering (zie §11 risico's).

---

## 3. Files to create / change

**API:**
- `app/api/admin/gebruikers/route.ts` — GET uitbreiden met extra aggregaties. POST ongewijzigd.

**UI:**
- `app/(app)/admin/gebruikers/page.tsx` — toevoegen: filterbar, kolommen, sortering, paginatie, empty states.
- `components/ui/select.tsx` — NIEUW, native `<select>`-wrapper voor plan-filter en "actief" toggle. Geen shadcn/radix nodig; we houden het licht.
- `components/ui/date-range-input.tsx` — NIEUW, twee native `<input type="date">` velden in één component. Voor datumfilters.
- `components/admin/GebruikerFilters.tsx` — NIEUW, bundelt zoekveld + 3 datumranges + plan-select + actief-select.
- `components/admin/GebruikerTabel.tsx` — NIEUW (optioneel), alleen als `gebruikers/page.tsx` boven 300 regels gaat.

**Library:**
- Geen extra npm dependencies. Native HTML form-elementen + bestaande Tailwind-klassen zijn genoeg voor v1. React-day-picker of shadcn/ui kunnen later vervangen.

**Documentatie:**
- Dit bestand (`docs/PLAN_CT_GEBRUIKERS_FILTERS.md`) blijft als design-reference.
- `docs/PROJECT_STATE.md` — link naar dit plan onder "Openstaande acties".

---

## 4. Data model impact

Geen nieuwe kolommen nodig. Bestaande tabellen dekken alle wensen mits we twee aggregaties batched uitvoeren.

Mapping van wens naar bron:

| Kolom / filter | Brontabel | Veld | Opmerking |
|---|---|---|---|
| Aangemaakt op | `profiles` | `created_at` | Al beschikbaar |
| Laatste login | `auth.users` | `last_sign_in_at` | Via `supabaseAdmin.auth.admin.listUsers({ page, perPage })` |
| Laatste nieuws vernieuwd | `user_news_read` | `MAX(updated_at)` per user | **Afhankelijk van open migratie** (zie §8) |
| Laatste analyse | `dba_assessments` | `MAX(created_at)` per user | Batch per user |
| Aantal analyses | `dba_assessments` | `COUNT(*)` per user | Batch per user |
| Plan (monthly/yearly/one_time/free) | `subscriptions` + `one_time_purchases` | via `getQuotaPlansForUsers` | Hergebruik bestaand |
| Actief bij maand/jaar | `subscriptions` | `status`, `cancel_at_period_end`, `current_period_end` | Afgeleide status |
| Vervuld bij eenmalig | `one_time_purchases` | `status`, `credit_used`, `finalized_at` | Afgeleide status |

**Definitie "Actief abonnement":**

- `'actief'` = `status IN ('active','trialing')` AND `cancel_at_period_end = false`
- `'loopt af'` = `status IN ('active','trialing')` AND `cancel_at_period_end = true` (toont einddatum)
- `'inactief'` = `status NOT IN ('active','trialing')`

**Definitie "Eenmalig vervuld":**

- `'beschikbaar'` = `status = 'purchased'` AND `credit_used = false`
- `'in uitvoering'` = `status = 'in_progress'`
- `'vervuld'` = `status IN ('finalized','converted')` OR `credit_used = true`
- `'vervallen'` = `status = 'expired'`

---

## 5. Security implications

- Autorisatiepoort ongewijzigd: `requireAdmin()` blokkeert niet-admins met 403.
- `supabaseAdmin.auth.admin.listUsers()` is service-role only. Al in gebruik elders. Geen nieuwe privilege-escalatie.
- Geen PII-uitbreiding: we tonen alleen data die de admin al kon inzien via Stripe-dashboard + Supabase Studio. Geen wachtwoord-hashes, geen tokens.
- CSV-export (§10) bevat dezelfde velden als de tabel, dus geen nieuwe lek.
- Input-validatie op filter-parameters: datums geparsed via `Date.parse()`, plan/status via strikte whitelist-match. Geen dynamische SQL-opbouw.
- Rate-limit: optioneel (admin-only endpoint, weinig risico). Niet in v1.

---

## 6. Implementation plan (stapsgewijs)

### Fase A: API-uitbreiding (~30 min)

1. In `app/api/admin/gebruikers/route.ts`:
   1. Haal profiles op (zoals nu).
   2. Batch `getQuotaPlansForUsers` (zoals nu).
   3. Nieuw: batch `supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })` en map `last_sign_in_at` per user_id.
   4. Nieuw: batch `dba_assessments` SELECT `user_id, created_at` WHERE `user_id IN (...)` — aggregeer in memory tot `Map<userId, { count, lastAt }>`.
   5. Nieuw: batch `subscriptions` SELECT `user_id, status, plan, cancel_at_period_end, current_period_end` WHERE `user_id IN (...)` — volledige subscription-state (niet alleen plan).
   6. Nieuw: batch `one_time_purchases` SELECT `user_id, status, credit_used, finalized_at, created_at` WHERE `user_id IN (...)` — volledige state.
   7. Nieuw (conditioneel op migratie): batch `user_news_read` SELECT `user_id, updated_at`; als tabel niet bestaat → alle users op `null`.
   8. Merge alles tot response-shape en stuur terug.

2. Nieuwe response-shape:

   ```ts
   type Gebruiker = {
     id: string
     user_id: string
     email: string
     role: 'admin' | 'user' | null
     created_at: string           // account
     last_sign_in_at: string | null
     last_news_read_at: string | null
     last_analyse_at: string | null
     aantal_analyses: number
     plan: 'free' | 'monthly' | 'yearly' | 'one_time'
     abonnement_status: 'actief' | 'loopt_af' | 'inactief' | 'n.v.t.'
     abonnement_periode_eind: string | null
     eenmalig_status: 'beschikbaar' | 'in_uitvoering' | 'vervuld' | 'vervallen' | 'n.v.t.'
   }
   ```

3. Performance-notitie: voor <1000 users zijn 5 batch-queries acceptabel (<500ms totaal). Boven 1000: server-side paging + filter-pushdown invoeren (§11).

### Fase B: UI-filterbar (~45 min)

1. Nieuwe `GebruikerFilters.tsx` met velden:
   - Vrij-tekst zoekveld op e-mail (debounce 200ms).
   - Drie date-range pickers: aangemaakt, laatst ingelogd, laatste analyse.
   - Plan-select: alle / free / monthly / yearly / one_time.
   - Abonnement-status-select: alle / actief / loopt af / inactief.
   - Eenmalig-status-select: alle / beschikbaar / in uitvoering / vervuld / vervallen.
   - Rol-select: alle / admin / gebruiker.
   - Minimum-analyses input (getal): "toon alleen users met >= N analyses".
   - Reset-knop.
2. Filter-state via `useState` + `useMemo` voor gefilterde dataset. Geen URL-query-sync in v1 (kan in v2).
3. Chip-display onder filterbar die actieve filters toont en per-chip verwijderen ondersteunt.

### Fase C: Tabel-update (~30 min)

1. Nieuwe kolommen (in volgorde):
   1. E-mail (met admin-badge)
   2. Plan
   3. Status (abonnement-status bij maand/jaar, eenmalig-status bij one_time)
   4. Analyses (aantal — klik opent sortering op laatste datum)
   5. Laatst actief (max van login + analyse + nieuws-read)
   6. Aangemaakt
   7. Acties (reset-mail-knop, ongewijzigd)
2. Sorteer-kopjes: klik op kolomnaam → sort ASC/DESC. Icoon arrowtje.
3. Paginatie: 25 / 50 / 100 per pagina, standaard 25. Client-side slice.
4. Empty state: "Geen gebruikers voldoen aan de filters" + reset-knop.
5. Count-footer: "X van Y gebruikers zichtbaar".
6. Hover: toon tooltip met exacte datum + relatieve tekst ("3 dagen geleden").

### Fase D: Kleine extra's

1. Badge "nieuw" voor users `<30 dagen oud`.
2. Waarschuwings-kleur voor users `last_sign_in_at > 60 dagen` (dim text, subtiel).
3. CSV-export-knop (client-side; `Papa.unparse` is al beschikbaar als dependency).
4. Behoud bestaande wachtwoord-reset-flow (POST endpoint blijft identiek).

---

## 7. UI-schets (tekstueel)

```
┌──────────────────────────────────────────────────────────────────┐
│ Gebruikers                                     [Vernieuwen] [CSV] │
│ 47 van 214 zichtbaar                                              │
├──────────────────────────────────────────────────────────────────┤
│ [ 🔍 Zoek op e-mail ]                                             │
│ Aangemaakt [  —  ] tot [  —  ]   Laatst ingelogd [  —  ] tot [—]  │
│ Laatste analyse [ — ] tot [ — ]                                   │
│ Plan [ alle ▾ ]  Abonnement [ alle ▾ ]  Eenmalig [ alle ▾ ]       │
│ Rol [ alle ▾ ]   Min. analyses [ 0  ]   [Reset filters]           │
│                                                                   │
│ Actief: [plan=monthly ×] [min analyses=3 ×]                       │
├──────────────────────────────────────────────────────────────────┤
│ E-mail          │ Plan    │ Status     │ Analyses │ Laatst actief │
│ jan@example.nl  │ Maand   │ Actief     │ 7        │ 2 d. geleden  │
│ piet@…          │ Eenm.   │ Vervuld    │ 1        │ 14 d. geleden │
│ …                                                                 │
├──────────────────────────────────────────────────────────────────┤
│ Vorige  1 2 3 … 9  Volgende       Per pagina: [25 ▾]              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Afhankelijkheden en volgorde

1. **Voorwaarde (zacht)**: migratie `user_news_read` uitvoeren in productie Supabase. Zonder deze migratie valt kolom "Laatste nieuws vernieuwd" op `n.v.t.`. Plan is robuust tegen ontbrekende tabel (try-catch of precheck).
2. **Volgorde**: Fase A kan stand-alone gebouwd en gereleased worden (UI blijft dan nog oude kolommen). Fase B + C tegelijk. Fase D optioneel.
3. **Git-flow**: aparte feature-branch `feat/ct-gebruikers-filters`. Merge naar `main` per fase of als één PR, Marvin kiest.

---

## 9. Validatie / test checklist

Unit-tests:

- [ ] Nieuwe pure functies (afgeleide `abonnement_status` + `eenmalig_status`) krijgen een test in `__tests__/admin-gebruikers.test.ts`. Minstens 8 fixtures (2 actief, 1 loopt af, 1 inactief × 3 one-time-states + 1 edge).
- [ ] Bestaande `entitlements.test.ts` blijft groen.

Handmatige validatie:

- [ ] Log in als admin, open `/admin/gebruikers`, zie alle nieuwe kolommen gevuld.
- [ ] Filter op plan=monthly, zie alleen maand-abonnees.
- [ ] Filter op aangemaakt <7 dagen, zie alleen verse users.
- [ ] Zoek op deel-e-mailadres, zie live filtering.
- [ ] Sorteer op aantal analyses descending, zie meest actieve boven.
- [ ] Klik reset-filters, zie alle users terug.
- [ ] CSV-export laadt een `.csv` met exact dezelfde kolommen.
- [ ] Paginatie: 25 → 50 → 100 per pagina werkt, teller klopt.
- [ ] Vercel-logs: geen nieuwe 500s op `/api/admin/gebruikers`.
- [ ] Mobile: tabel scrollt horizontaal i.p.v. doorbreken (behoud `overflow-x-auto`).

Typecheck + lint:

- [ ] `npx tsc --noEmit` zonder nieuwe errors.
- [ ] `npx eslint` op alle gewijzigde files exit 0.

---

## 10. Extra suggesties (optioneel, niet in v1 tenzij je wilt)

- **Click-through per user**: regel-klik opent detailpaneel met alle analyses van die user + plan-historie.
- **Bulk-mail**: selectie van N users → verstuur event naar Loops (bv. win-back campagne).
- **Trendindicator**: pijl die aangeeft of user `actiever` of `minder actief` is geworden dan de vorige maand.
- **Supabase-view**: materialized view `admin_user_overview` die alle aggregaties pre-joint, ververst elke 5 min. Zet de API in één SELECT. Verschuif naar fase waar dataset dit eist (>5000 users).
- **PostHog-koppeling**: klik op user toont funnel van dat specifieke user_id in PostHog (deep-link).

---

## 11. Risico's en follow-up

- **Schaal**: client-side filter/sort op 1000+ rows wordt merkbaar traag. Overstappen naar server-side pagination met PostgREST-filter-pushdown als dataset boven 1000 users komt. Benchmark nu nog niet nodig.
- **user_news_read migratie**: als die niet uitgevoerd is, blijft kolom leeg. Nette handling in de API (tabel-bestaat-check via `pg_catalog.pg_tables` of try-catch op de query) voorkomt 500.
- **auth.admin.listUsers pagination**: boven 1000 users retourneert deze call pagineerd. Moet in API geloopt worden. Nu nog niet kritiek.
- **Plan-definitie drift**: als `resolveQuotaPlan`-regels wijzigen, kolom "Plan" volgt automatisch mee (bron van waarheid is centraal). Status-kolommen worden hier afgeleid en moeten met `resolveQuotaPlan` in sync blijven. Unit-tests vangen regressie.
- **Responsiveness**: tabel met 8+ kolommen op mobile vereist horizontale scroll. Design-keuze: niet afknappen, laat scrollen.
- **Accessibility**: filterbar-selects en date-inputs zijn native HTML, dus a11y bij default. Sorteer-kopjes krijgen `aria-sort`.

---

## 12. Schatting effort

| Fase | Inhoud | Schatting |
|---|---|---|
| A | API-uitbreiding + tests voor afgeleide statussen | 45 min |
| B | Filterbar component + state | 45 min |
| C | Tabel-kolommen, sort, paginatie | 45 min |
| D | CSV-export + badges | 30 min |
| | Handmatige validatie + type/lint + commit | 15 min |
| **Totaal** | | **~3 uur** in één rustige sessie |

Deze plan is atomair: elke fase kan los gereleased worden als tussentijds stoppen moet.

---

## 13. Aanbevolen startpunt volgende sessie

1. Schone branch: `git checkout -b feat/ct-gebruikers-filters`
2. Begin Fase A (API). Verifieer lokaal dat de response-shape klopt.
3. Schrijf eerst de unit-tests voor de twee pure status-afgeleiden, dán de merge.
4. Pas daarna UI (Fase B + C).
5. Commit per fase met duidelijke scope in de commit-message.

Einde plan.
