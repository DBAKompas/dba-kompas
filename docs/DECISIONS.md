# DECISIONS.md
**Architectuurbeslissingen logboek**

Elke beslissing bevat: datum, beslissing, reden, alternatieven overwogen.

---

## 2026-04-10 — Loops conversiestop via Audience filter, niet via Goal

**Beslissing:** Flow-stopzetting bij conversie (aankoop/abonnement) wordt geïmplementeerd via een `Audience filter` node na elke `Branch` node — niet via een aparte "Goal event" instelling.

**Mechanisme:**
- Na elke `Send email` node: `Branch (1 branch)` → `Audience filter: subscription_status does not equal "active"` (scope: All following nodes) → Timer → volgende email
- Als `subscription_status` wijzigt naar `active` (via Stripe webhook → Loops contact update): contact passeert de Audience filter niet → flow stopt automatisch
- De "active" tak van de Branch is verwijderd (was overbodig en veroorzaakte Loops-validatiefout)

**Reden:**
- Loops heeft geen aparte "Goal event" UI-knop die de flow stopt bij een event
- De `subscription_status` contact property wordt al correct bijgewerkt vanuit de Stripe webhook (`handleCheckoutCompleted` → `updateLoopsContact`)
- "All following nodes" scope zorgt dat conversie op elk punt in de flow de rest stopt

**Alternatieven overwogen:**
- Goal event in Loops: bestaat niet als dedicated feature
- DELETE contact via Loops API bij aankoop: te destructief (verwijdert contact volledig)
- Branch met twee takken (active → Loop completed, not active → doorgaan): technisch correct maar Loops klaagt over "Extra node does not ultimately lead to any emails sent" als de active-tak naar Loop completed gaat zonder email ertussen. Opgelost door de active-tak te verwijderen en alleen de Audience filter te gebruiken.

**Impact:**
- Geconverteerde contacts ontvangen geen verdere emails in de journey
- Architectuur is eenvoudiger dan Branch met twee takken

---

## 2026-04-10 — Loops CTA-URLs tijdelijk op Vercel-URL

**Beslissing:** CTA-buttons in alle 9 Loops-emails wijzen tijdelijk naar `https://dba-kompas.vercel.app/register?plan=...&email={contact.email}` in plaats van `https://dbakompas.nl/register?...`.

**Reden:**
- Productiedomein `dbakompas.nl` is nog niet live (wacht op INFRA-001 — DNS migratie Cloudflare)
- De `/register` pagina op Vercel werkt al volledig correct (plan + email query params verwerkt)
- Testen is mogelijk via Vercel URL

**Actie bij livegang:**
- In alle 9 Loops-emails de URL-prefix omzetten van `dba-kompas.vercel.app` naar `dbakompas.nl`
- Dit is een handmatige actie in het Loops dashboard (per email, per button)

---

## 2026-04-10 — Loops merge tag syntax: single curly braces

**Beslissing:** In Loops-emails wordt `{contact.email}` gebruikt (één haakjeset), niet `{{contact.email}}` (twee haakjesets).

**Reden:**
- Loops' editor toont en verwerkt merge tags met één haakjeset
- In URL-velden van Button blocks: `https://dbakompas.nl/register?plan=one_time_dba&email={contact.email}`
- Dubbele haakjes (`{{contact.email}}`) zijn de Loops-documentatienotatie maar de editor zelf gebruikt enkelvoudige haakjes

---

## 2026-04-10 — Oude Loops journeys bewust intact gelaten

**Beslissing:** De drie bestaande loops (`quick_scan_completed - high`, `quick_scan_completed - medium`, `quick_scan_completed - low`) worden NIET verwijderd tijdens deze fase.

**Reden:**
- Deze loops zijn gekoppeld aan de oude Replit-versie van de quick scan
- De nieuwe DBA Kompas app stuurt events naar de nieuwe journeys (DBA Kompas — Quick Scan Hoog/Gemiddeld/Laag risico)
- Verwijdering pas bij livegang op `dbakompas.nl` — dan is de overgang definitief

**Actie bij livegang:**
- Verwijder `quick_scan_completed - high`, `quick_scan_completed - medium`, `quick_scan_completed - low` uit Loops

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

## 2026-04-09 — Conversie-funnel architectuur (geconsolideerde versie)

**Beslissing:** De registratie- en checkout-flow loopt als volgt:

1. **Landing page** → gebruiker klikt op plan → `EmailCheckoutModal` opent
2. **`EmailCheckoutModal`** → stap 1: plan-selectie, stap 2: email + wachtwoord + legal checkbox → knop "Account aanmaken & betalen"
   - `supabase.auth.signUp()` direct in modal (geen redirect naar externe pagina)
   - Sessie direct beschikbaar (`data.session`) → POST naar checkout API → `window.location.href = json.url` (Stripe)
   - Sessie nog niet beschikbaar (e-mailverificatie vereist) → `verifyMode: true` → verifyscherm binnen modal
   - `emailRedirectTo`: `/auth/callback?next=/checkout-redirect?plan=...`
3. **`/checkout-redirect`** → auto-POST naar checkout API → Stripe
4. **Stripe checkout** → betaald → `/dashboard?session_id=...` → groen succesbericht

**Fallback-pagina's (voor directe URL-toegang of edge cases):**
- `/register` — volledig signup+checkout formulier met pre-filled email/plan
- `/auth/signup` — server redirect naar `/login` (target QuickScan success screen)

**Reden:**
- Oorspronkelijk: modal redirect naar `/register?email=...&plan=...` — dubbele stap, slechte UX (gebruiker moest al ingevulde email opnieuw invoeren)
- `supabase.auth.signUp()` werkt probleemloos client-side vanuit modal
- Verifyscherm inline in modal is beter UX dan volledige pagina-redirect
- Stripe price IDs worden server-side opgezocht via `plan`-naam — client kent nooit de price IDs

**Alternatieven overwogen:**
- Redirect naar `/register` (oude situatie): extra stap, slechte UX, redundante invulvelden
- Aparte `/api/auth/register` endpoint: onnodige complexiteit — Supabase client-side signUp werkt prima

---

## 2026-04-09 — Paywall via AuthContext + AppShell (client-side)

**Beslissing:** Paywall implementatie via client-side `AuthContext` plan state + `AppShell` redirect.

**Mechanisme:**
- `GET /api/user/plan` server endpoint roept `getUserPlan()` aan
- `AuthContext` fetcht dit endpoint na user confirmatie, slaat op als `plan: 'free' | 'pro' | 'enterprise'`
- `AppShell` in `app/(app)/layout.tsx`: als `plan === 'free'` → `router.push('/upgrade')` (uitzondering: `/profiel`)
- `/upgrade` paywallpagina toont 3 plankaarten met directe Stripe checkout

**Reden:**
- Eenvoudig te implementeren op client-side — voldoende voor MVP
- `getUserPlan()` checkt zowel `subscriptions` als `one_time_purchases` → correcte entitlement check
- Uitzondering `/profiel` noodzakelijk zodat gebruikers hun account kunnen beheren ook zonder betaling

**Alternatieven overwogen:**
- Next.js middleware (server-side): robuuster (geen flicker), maar complexer — middleware heeft geen toegang tot Supabase admin; vereist eigen cookie-parsing. Te complex voor MVP.
- Route Groups met server component check: vergelijkbaar resultaat maar meer duplicatie
- RLS-only: onvoldoende — RLS beschermt data maar niet routes

**Risico:**
- Korte flicker (loading state) terwijl plan wordt opgehaald — acceptabel voor MVP
- Client-side redirect kan worden omzeild door technisch vaardige gebruikers — data is alsnog beschermd via RLS en rate limiting

---

## 2026-04-09 — One-time upsell: upgrade-to-pro als server component

**Beslissing:** `/upgrade-to-pro` is een server component zonder UI — puur server-side logica, directe Stripe redirect.

**Mechanisme:**
1. Authenticatiecheck → redirect naar `/login?next=/upgrade-to-pro` als niet ingelogd
2. Conflict check: actief/trialing abonnement in `subscriptions` tabel → redirect naar `/dashboard`
3. Coupon eligibilitycheck: `one_time_purchases` rij aanwezig met `status = 'purchased'` → voeg `discounts: [{ coupon: STRIPE_COUPON_ONE_TIME_UPGRADE }]` toe
4. Bestaande `stripe_customer_id` uit profiel → `customer` parameter zodat Stripe klant herkent
5. Stripe checkout session aanmaken → `redirect(session.url)`

**Reden:**
- Geen UI nodig — de pagina is puur een server-side actie (net als een API route, maar toegankelijk als URL)
- Conflict check voorkomt dat iemand met actief abonnement opnieuw een abonnement aanmaakt (Stripe error)
- Coupon server-side toegepast — client kent nooit de coupon ID

**Alternatieven overwogen:**
- API route (`POST /api/upgrade-to-pro`): vrijwel identiek maar vereist een aparte UI-pagina die de POST triggert — extra complexiteit zonder voordeel
- Client-side checkout met coupon: onveilig — coupon ID zou client-exposed zijn

---

## 2026-04-09 — Stripe coupon mechanisme voor one-time upgrade korting

**Beslissing:** Stripe coupon `ONETIMECREDIT` (€9,95 off, `duration: 'once'`) toegepast via `discounts` parameter bij subscription checkout.

**Mechanisme:**
- Coupon aangemaakt in Stripe Dashboard (test mode): `amount_off: 995`, `currency: EUR`, `duration: 'once'`
- ID: `ONETIMECREDIT` (of ander ID) opgeslagen als `STRIPE_COUPON_ONE_TIME_UPGRADE` env var
- Server-side conditionally toegevoegd in `/upgrade-to-pro` page als gebruiker `one_time_purchases` heeft
- Stripe regelt automatisch: eerste factuur €20 − €9,95 = €10,05, daarna normaal €20/maand

**Reden:**
- Coupon logica 100% in Stripe — geen eigen factuurberekeningen nodig
- `duration: 'once'` is de eenvoudigste en veiligste optie: exacte terugkeer naar normaalprijs gegarandeerd
- Coupon ID server-side — client weet nooit of/welke coupon wordt toegepast

**Let op voor productie:**
- Coupon `ONETIMECREDIT` bestaat alleen in test mode — live mode equivalent aanmaken vóór launch
- `STRIPE_COUPON_ONE_TIME_UPGRADE` env var updaten naar live mode coupon ID in Vercel

---

## 2026-04-09 — iDEAL verwijderd uit subscription checkout

**Beslissing:** `payment_method_types: ['card', 'ideal']` verwijderd uit `app/api/billing/checkout/route.ts`.

**Reden:**
- iDEAL ondersteunt geen recurring payments — Stripe geeft een fout als iDEAL wordt opgegeven bij `mode: 'subscription'`
- Dit was de primaire oorzaak van HTTP 500 bij elke subscription checkout
- Zonder `payment_method_types` parameter: Stripe toont automatisch alle ondersteunde methoden voor het land van de gebruiker

**Impact:**
- iDEAL beschikbaar voor one-time checkout (waar het wel werkt)
- Subscription checkout werkt nu correct

---

## 2026-04-08 — `trialing` telt als actief Pro-plan

**Beslissing:** `getUserPlan()` in `modules/billing/entitlements.ts` herkent `trialing` als actieve Pro-status, naast `active`.

**Reden:**
- Stripe `trialing` status betekent dat een abonnement is aangemaakt maar de trial-periode nog loopt
- Gebruikers in trial moeten dezelfde toegang hebben als betalende gebruikers
- Zonder deze fix zouden trial-gebruikers als 'free' worden behandeld en een slechtere UX ervaren

**Impact:**
- Gebruikers met `subscription.status = 'trialing'` krijgen nu `plan = 'pro'` terug
- Rate limit voor trial users: 100/dag (was 20/dag)

---

## 2026-04-08 — `STRIPE_PRICE_ID_ONE_TIME` als canonieke env var naam

**Beslissing:** De one-time checkout route gebruikt `process.env.STRIPE_PRICE_ID_ONE_TIME` (was `STRIPE_ONE_TIME_DBA_PRICE_ID`).

**Reden:**
- `.env.local` en Vercel env vars gebruikten al `STRIPE_PRICE_ID_ONE_TIME`
- Code gebruikte een afwijkende naam → one-time checkout gaf altijd HTTP 500
- `.env.local` is leidend — code aangepast aan de bestaande conventie

**Impact:**
- One-time checkout werkt nu correct als `STRIPE_PRICE_ID_ONE_TIME` is ingesteld

---

## 2026-04-08 — Dashboard success banner na checkout

**Beslissing:** Na een geslaagde Stripe checkout redirect (`?session_id=...`) toont het dashboard een groene banner. De `?session_id` en `?one_time` params worden daarna uit de URL verwijderd.

**Reden:**
- Gebruiker krijgt geen feedback als betaling gelukt is zonder deze banner
- Verwijdering van URL-params voorkomt dat de banner bij elke page refresh terugkomt
- Twee varianten: subscription-tekst en one-time-tekst

**Impact:**
- `app/(app)/dashboard/page.tsx` detecteert `searchParams.get('session_id')` in `useEffect`
- URL wordt gecleaned via `router.replace()` zonder re-render

---

## 2026-04-09 — Resend als Supabase SMTP provider (INFRA-001)

**Beslissing:** Resend wordt gebruikt als SMTP provider voor Supabase Auth e-mails (verificatie, wachtwoord reset).

**Reden:**
- Resend is al in de stack voor transactionele e-mails (upsell, digests)
- Één provider voor alle e-mail — minder complexiteit
- Supabase ingebouwde mailservice heeft rate limits (~3/uur) — niet geschikt voor productie
- Resend SMTP: `smtp.resend.com:465`, user `resend`, password = API key

**MX record bewust overgeslagen:**
- STRATO's MX-beheer laat geen subdomein-MX toe zonder de root MX te wijzigen
- Root MX aanpassen zou inkomende mail (`info@dbakompas.nl`) breken
- MX is alleen nodig voor inkomende mail via Resend (Enable Receiving) — dat is niet gewenst
- DKIM + SPF TXT zijn voldoende voor het verzenden van e-mail

**Status:** IN PROGRESS — DNS propagatie loopt nog bij STRATO

---

## 2026-04-09 — Vitest als testframework (QUAL-001/002)

**Beslissing:** Vitest 2.1.0 als testframework toegevoegd (niet Jest).

**Reden:**
- Vitest heeft native TypeScript + ESM support — geen Babel config nodig
- `vi.mock()` + `vi.hoisted()` pattern werkt correct met Next.js module-level singletons (Anthropic SDK)
- Sneller dan Jest voor dit type project

**Mock strategie voor Anthropic:**
- `anthropic` is een module-level singleton in `dbaAnalysis.ts`
- `vi.hoisted(() => vi.fn())` declareerd `mockCreate` vóór de module-hoist
- `vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn().mockImplementation(...) }))` onderschept de constructor
- Geen echte Anthropic API calls in tests

---

## 2026-04-09 — vercel.json regio fra1

**Beslissing:** Vercel deployment gefixeerd op regio `fra1` (Frankfurt).

**Reden:**
- Nederlandse gebruikers — Frankfurt is de dichtstbijzijnde EU-regio
- GDPR: data blijft in de EU
- `maxDuration = 120` is al ingesteld in de route files zelf — niet nodig in vercel.json

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
