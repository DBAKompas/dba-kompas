# IMPLEMENTATIE_PLAN — Supabase API Key migratie

**Status:** Draft, ter review
**Auteur:** Claude (sessie 24)
**Datum opgesteld:** 2026-04-23
**Geplande uitvoering:** Aparte werksessie, voor 2026-05-07
**Relatie tot ARCHITECTURE.md:** Geen nieuwe architectuur. Alleen vervanging van identity-materiaal en hernoeming van env vars.
**Relatie tot SECURITY_BASELINE.md:** Aanscherping van §10 Secrets Handling en §16 Prohibited Shortcuts (geen legacy key-paden meer).

---

## 1. Scope summary

Vervang de legacy HS256-JWT-based Supabase API keys (`anon` + `service_role`) door de nieuwe `sb_publishable_` + `sb_secret_` API keys, en disable daarna de legacy JWT-keys volledig in Supabase.

Aanleiding: de Vercel × Context.ai OAuth-compromise van april 2026 markeerde `SUPABASE_SERVICE_ROLE_KEY` als `Needs Attention`. Diagnose toont aan dat de waarde in Vercel nog steeds de originele HS256-JWT is die is gesigneerd met het `Legacy JWT Secret` dat Supabase als `Previous key` aanhoudt na hun eigen rotatie op 2 april 2026. Zolang dat secret aan Vercel-zijde onveranderd is, is het theoretisch bruikbaar door een aanvaller die het secret in handen heeft.

De klassieke flow `Generate new JWT secret` bestaat niet meer in de nieuwe Supabase-UI. Supabase's eigen gedocumenteerde upgrade-pad is migratie naar `sb_publishable_` + `sb_secret_`.

**Buiten scope:**
- Sentry SDK volledige aansluiting (aparte backlog-item P1)
- Client-side Sentry fix (`withSentryConfig` + `instrumentation.ts`)
- Overige lopende werkzaamheden op TASKS.md

---

## 2. Architectuurimpact

Geen. Alle wijzigingen zijn lokaal aan de Supabase-client-instanties en de env-var-laag. De architectuurrichtlijn `server-side enforcement, RLS mandatory, secrets niet in client-bundles` blijft 1-op-1 gerespecteerd.

Bevestigd op basis van Supabase-docs (bronnen in §9):
- `sb_publishable_` gedraagt zich identiek aan `anon` (veilig voor client-bundle, respecteert RLS)
- `sb_secret_` gedraagt zich identiek aan `service_role` (RLS bypass, server-only)
- `auth.role()` helper blijft `'service_role'` retourneren voor requests met `sb_secret_` in de Authorization-header. De 10 RLS-policies met `USING (auth.role() = 'service_role')` blijven ongewijzigd werken.

---

## 3. Files to create/change

### 3.1 Code (5 bestanden)

| Bestand | Huidige ref | Nieuwe ref |
|---|---|---|
| `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SECRET_KEY` |
| `proxy.ts` (r. 50 tot 51) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `app/update-password/page.tsx` (r. 15 tot 16) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

### 3.2 Documentatie

| Bestand | Aanpassing |
|---|---|
| `docs/DEPLOYMENT.md` | §Supabase tabel updaten met nieuwe env-var-namen |
| `docs/PROJECT_STATE.md` | Sessie-entry toevoegen waar migratie is voltooid |
| `docs/DECISIONS.md` | ADR toevoegen: "Migratie naar `sb_publishable_` / `sb_secret_` (2026-04-23)" |
| `docs/KNOWN_ISSUES.md` | KI aanmaken of sluiten indien reeds geopend |

### 3.3 Geen migratie-SQL vereist

De 10 bestaande RLS-policies in `supabase/migrations/001_initial_schema.sql`, `002_cleanup_and_full_schema.sql`, `007_usage_counters.sql` en `008_admin_alert_triggers.sql` blijven ongewijzigd, inclusief alle `USING (auth.role() = 'service_role')`-clausules en `GRANT ... TO service_role`-statements. Supabase behoudt de Postgres-rol `service_role` als targetrol voor `sb_secret_`-keys.

---

## 4. Data model impact

Geen. Er worden geen tabellen, kolommen, indices of policies gewijzigd. Dit is een pure identity-material-rotatie op transport-niveau.

Data-migratie niet van toepassing.

---

## 5. Security implicaties

### 5.1 Positief

- Compromitteerde legacy HS256-JWT's worden waardeloos zodra Fase 2 voltooid is (legacy JWT-keys disabled in Supabase). Een aanvaller met het oude Legacy JWT Secret kan dan geen geldige tokens meer produceren die Supabase accepteert.
- Symmetrische HS256 vervangen door asymmetrische ECC P-256 voor user-JWTs (al actief sinds 2 april 2026, zie "Current key" op JWT Keys-pagina). Compromitering van de verificatie-kant levert geen signing-capability op.
- Nieuwe keys zijn niet langer JWT's maar opaque tokens, waardoor key-exfiltratie via log-sampling van JWT-payloads irrelevant wordt.

### 5.2 Neutraal

- RLS-gedrag blijft 100% gelijk. Tenant-isolatie wordt niet sterker of zwakker door deze migratie.
- `SUPABASE_SECRET_KEY` blijft, net als `SUPABASE_SERVICE_ROLE_KEY`, een full-access bypass-credential dat uitsluitend server-side mag worden gebruikt. Vercel-scope: Production + Preview, met Sensitive aan. Dev-scope: uitgesloten (conform `Sensitive isn't available for Development variables`-beleid dat we in Sentry-rotatie al toepasten).

### 5.3 Risico's

- Korte overlap-periode waarin legacy én nieuwe keys beide actief zijn. Tijdens deze periode is de security-situatie niet strikter dan vandaag. Bounded door Fase 2 (disable legacy) direct na succesvolle Fase 1 validatie.
- Env-var-typfout leidt tot runtime-failures na deploy (`JWTInvalid` of 401). Gemitigeerd via Vercel Preview-deploy-verificatie voor Production-deploy.

---

## 6. Implementation plan

### Fase 0: Voorbereiding (lokaal, ongeveer 15 minuten)

1. Nieuwe feature-branch maken: `security/supabase-key-migration`.
2. In Supabase Dashboard: noteer de huidige `sb_publishable_...` en `sb_secret_...` waarden uit tab `Publishable and secret API keys`. De publishable waarde is al zichtbaar (`sb_publishable_8nPTGnAf_Vh3Y6yPCVwVcA_xZ6JDcrF` per laatste observatie, maar verifieer opnieuw vlak voor gebruik). De secret waarde moet via `Reveal` worden opgehaald en gelijk in 1Password worden opgeslagen.
3. Controleer dat deze keys `default` als naam hebben en niet zijn gedisabled.

### Fase 1: Code + env vars + deploy (ongeveer 45 minuten)

1. **Code update** op feature-branch. Vervang op 5 plekken de env-var-referentie (zie §3.1). Houd de expressie van de `createClient`-calls identiek.
2. **Unit tests** draaien lokaal: `npm test`. Verwacht resultaat: alle bestaande tests groen, want env-var-interpretatie via `process.env` blijft identiek.
3. **Lokale build-check**: `npm run build`. Verwacht resultaat: groen.
4. **Vercel env vars toevoegen** (NIET vervangen, beide laten bestaan tijdens Fase 1):
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...` (scope: Production + Preview + Development, niet Sensitive, dit is een public key)
   - `SUPABASE_SECRET_KEY` = `sb_secret_...` (scope: Production + Preview, Sensitive aan, geen Development)
5. **Push branch** naar GitHub. Vercel bouwt automatisch een Preview-deploy.
6. **Preview-smoke test** (zie §8) op de Preview-URL. Als groen, door naar stap 7. Als rood, debug en herhaal.
7. **Merge naar main** via PR. Production-deploy gebeurt automatisch.
8. **Production-smoke test** (zie §8). Als groen, door naar Fase 2. Als rood, onmiddellijke rollback via Vercel `Rollback`-knop naar de vorige Production-deploy en debuggen.

### Fase 2: Legacy keys disablen (ongeveer 10 minuten, minstens 24 uur na Fase 1)

Reden voor wachttijd: eventuele edge-runtime-routes of cron-jobs die nog cached state hebben moeten minstens één cyclus doorlopen met de nieuwe keys voordat de oude irreversibel worden uitgeschakeld.

1. In Supabase Dashboard → Project Settings → API Keys → tab `Legacy anon, service_role API keys`.
2. Klik knop `Disable JWT-based API keys`.
3. Bevestig. Supabase laat de legacy keys bestaan maar weigert ze voortaan voor requests.
4. Verifieer direct via Sentry + Vercel Logs: er komen geen 401/JWTInvalid-bursts binnen.
5. Als er binnen 15 minuten geen error-spike is, Fase 2 als succesvol beschouwen.

### Fase 3: Opruimen Vercel env vars (ongeveer 5 minuten, direct na Fase 2)

1. Vercel Dashboard → Project → Settings → Environment Variables.
2. Verwijder `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Verwijder `SUPABASE_SERVICE_ROLE_KEY`.
4. Geen redeploy nodig, want code referieert deze vars niet meer.

### Fase 4: Documentatie + backlog-afsluiting (ongeveer 15 minuten)

1. `docs/DEPLOYMENT.md` updaten.
2. `docs/DECISIONS.md` ADR toevoegen.
3. `docs/PROJECT_STATE.md` sessie-entry toevoegen.
4. `docs/KNOWN_ISSUES.md` sluiten met migratie-datum.
5. Backlog-item `migratie naar Supabase sb_publishable_/sb_secret_` afvinken in TASKS.md.

---

## 7. Code

Conform projectafspraak: geen code in deze plan-sessie. Diffs worden in de implementatiesessie opgesteld na review en goedkeuring van dit plan.

Verwachte grootte: 5 single-line edits (env-var naam), geen structurele wijzigingen.

---

## 8. Validation / test checklist

### 8.1 Smoke test Preview (Fase 1 stap 6)

- [ ] Homepage laadt zonder console-errors op Preview-URL
- [ ] Registreren nieuw testaccount → bevestigingsmail → inloggen werkt
- [ ] Analyse indienen via `/analyse` (authenticated flow) werkt end-to-end
- [ ] Admin-pagina `/admin/alerts` toont bestaande records (service-role-pad)
- [ ] Cron-endpoint handmatig triggeren met `CRON_SECRET` levert 200 op
- [ ] Stripe webhook simulatie via Stripe CLI (`stripe trigger checkout.session.completed`) wordt correct verwerkt

### 8.2 Smoke test Production (Fase 1 stap 8)

Identiek aan §8.1 maar dan op `https://dbakompas.nl`. Gebruik een throw-away testaccount, ruim na validatie op.

### 8.3 Post-disable verificatie (Fase 2 stap 4 tot 5)

- [ ] Geen `JWTInvalid` in Sentry in 15 minuten na disable
- [ ] Geen 401-burst in Vercel Function Logs
- [ ] Willekeurige authenticated pagina laadt binnen 5 seconden zonder errors

### 8.4 Post-cleanup (Fase 3)

- [ ] `grep -r "SUPABASE_SERVICE_ROLE_KEY\|NEXT_PUBLIC_SUPABASE_ANON_KEY" .` in de repo geeft geen treffers (behalve evt. historische migratie-docs)
- [ ] Vercel env vars bevatten geen `NEXT_PUBLIC_SUPABASE_ANON_KEY` en geen `SUPABASE_SERVICE_ROLE_KEY` meer

---

## 9. Risks & follow-up

### 9.1 Risico's

| Risico | Waarschijnlijkheid | Impact | Mitigatie |
|---|---|---|---|
| Typfout in env-var-naam | Laag | Hoog (app down) | Preview-deploy verifieert voor Production |
| Supabase legacy-disable is irreversibel binnen 24u | Laag | Middel (moet herstel via support) | Fase 2 pas na 24u Fase 1-observatie |
| `auth.role()` gedraagt zich anders dan docs aangeven | Zeer laag | Hoog (RLS-regressie) | Preview-smoke test dekt admin- en cron-paden |
| Vergeten cron-job of edge-route refereert oude env | Middel | Middel (401 in logs) | Grep voor beide env-namen voor PR-merge |
| Sessies van ingelogde testgebruikers worden ongeldig | Zeker | Laag (geen klanten) | Eenmalig opnieuw inloggen |

### 9.2 Follow-up na migratie

- Entitlement-audit: zijn alle plekken waar `supabaseAdmin` wordt gebruikt daadwerkelijk server-only (geen accidentele client-import)?
- IP-allowlist overwegen in Supabase zodra stabiele Vercel-egress-IP's bekend zijn (defense-in-depth bovenop key-secrecy)
- Overstap van verschillende app-contexten naar gescoped secret keys als Supabase die GA heeft (op datum van schrijven nog beta)

---

## 10. Bronnen

- [Understanding API keys — Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [Use of new API keys · Discussion #40300 · supabase](https://github.com/orgs/supabase/discussions/40300)
- [Rotating Anon, Service, and JWT Secrets — Supabase Docs](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd)
- [Upcoming changes to Supabase API Keys · Discussion #29260 · supabase](https://github.com/orgs/supabase/discussions/29260)

---

## 11. Review-checklist voor Marvin

- [ ] Scope is helder en niet groter dan nodig
- [ ] Architectuurimpact-analyse is geloofwaardig (geen nieuwe patterns)
- [ ] Files-lijst is compleet (geen andere `SUPABASE_*`-refs over het hoofd gezien)
- [ ] Security-impact is correct geanalyseerd
- [ ] Fasering met 24-uurs observatie tussen Fase 1 en Fase 2 is akkoord
- [ ] Smoke-testlijst dekt alle kritieke paden (auth, analyse, admin, cron, webhook)
- [ ] Rollback-pad in geval van problemen is duidelijk
- [ ] Planning (voor 2026-05-07) is haalbaar
