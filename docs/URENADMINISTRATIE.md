# Urenadministratie DBA Kompas
**Periode:** Architectuurfase t/m app live op dbakompas.nl
**Bijgewerkt:** 2026-04-12

---

## 1. Architectuurdocumenten opstellen (bouwstraat)

**Toelichting:**
Voordat ik een regel code schreef, heb ik de volledige SaaS-bouwstraat op papier gezet. Dit was geen losse notitie, maar een stelsel van negen bindende documenten: MASTER_REPORT, ARCHITECTURE, CODING_STANDARDS, SECURITY_BASELINE, DESIGN_SYSTEM, INTEGRATIONS, EVENTS, PRODUCT_SCOPE en IMPLEMENTATION_PLAN. Het doel was om te voorkomen dat AI-output chaotisch of inconsistent zou worden, en om de structuur reproduceerbaar te maken voor toekomstige producten.

**Taken uitgevoerd:**
- Productrichting bepaald: SaaS-webapplicatie + marketingwebsite, gescheiden deployment
- Techstack vastgesteld en onderbouwd: Next.js, Supabase, Stripe, Resend, Loops, Vercel, PostHog, Sentry
- Architectuurprincipes vastgelegd: scheiding UI / API / modules / lib / database
- Billing- en entitlementsmodel beschreven: Stripe als engine, eigen database als toegangswaarherd
- Datastructuur bepaald: multi-tenant light met `account_id` als isolatielaag
- Coderingsstandaarden, securitybaseline en designsysteem vastgelegd
- Eventmodel gedefinieerd voor analytics en lifecycle
- Productscope DBA Kompas vastgelegd (doelgroep, modules, flows, monetisatie)
- Implementatieplan gefaseerd uitgewerkt (7 fasen)

**Uitdagingen:**
De grootste uitdaging was het meteen goed formuleren van architectuurprincipes die strikt genoeg zijn om AI-output te sturen, maar niet zo rigid dat ze elke implementatiebeslissing blokkeren. Ik heb bewust gekozen voor een "binding constraints"-aanpak: niets in de documenten is vrijblijvend.

**Tijdsinschatting (mens):** 6 uur

---

## 2. Migratie van Replit naar Next.js

**Toelichting:**
De bestaande DBA Kompas-app draaide op Replit als prototype. Ik heb de volledige codebase geanalyseerd, de zip-bestanden verwerkt en alles herbouwd op de nieuwe stack. Dit was geen simpele copy-paste: de Replit-versie had geen architectuurlaag, geen tests, geen deployment-configuratie en geen productionele billing-integratie. Alles moest opnieuw worden opgezet conform de bouwstraat.

**Taken uitgevoerd:**
- Replit-codebase doorgelicht: landing page + app inclusief alle features geïnventariseerd
- Next.js project scaffolded met de juiste mappenstructuur (app, components, modules, lib, db, config, docs)
- Supabase gekoppeld: authenticatie, database schema, RLS policies
- DBA analyse module overgezet: Claude API-integratie, inputvalidatie, outputverwerking
- Stripe integratie overgezet: subscription checkout, one-time checkout, webhook handler
- Resend integratie overgezet: transactionele e-mails
- Loops integratie overgezet: contact sync, event tracking
- Nieuwsfeed module overgezet: curated feed, AI-samenvattingen
- PDF rapport generatie overgezet: pdfkit, opmaak
- Notificaties en documentbeheer overgezet
- Quick Scan landing page overgezet en gekoppeld aan Loops
- Vercel deployment opgezet: GitHub koppeling, auto-deploy, env vars
- PostHog en Sentry basisintegratie ingericht

**Uitdagingen:**
De Replit-versie had geen heldere scheiding tussen frontend en backend. Vrijwel alle logica zat door elkaar. Ik moest elke functie herinpassen in de juiste laag (modules voor business logic, lib voor integraties, API-routes dun houden). Daarnaast waren er veel impliciete aannames in de Replit-code die ik eerst moest ontrafelen voordat ik ze correct kon herbouwen.

**Tijdsinschatting (mens):** 25 uur

---

## 3. Stabilisatie, security en UX-verbeteringen (2026-04-07)

**Toelichting:**
Na de migratie was de app functioneel maar nog niet stabiel of veilig genoeg. Ik heb een volledige ronde gedaan door de codebase om kwetsbaarheden te dichten, performance te verbeteren en de UX fundamenteel te verbeteren.

**Taken uitgevoerd:**

*AI-laag:*
- Overstap van `claude-opus-4-6` naar `claude-haiku-4-5-20251001` voor alle AI-functies (responstijd van 20+ naar 5-8 seconden)
- Two-phase architectuur geimplementeerd: fase 1 snelle kernanalyse (max 10 seconden), fase 2 draft generatie asynchroon
- Fase 1 prompt afgeslankt: zware velden verwijderd om truncatierisico te elimineren
- Nuclear/coerce validator gebouwd voor `validateDbaEngineOutput` en `validateDbaDraftOutput`: altijd bruikbare output, ook bij gedeeltelijke respons van Haiku
- Code fence stripping toegevoegd: Haiku wikkelde JSON soms in Markdown code blocks
- JSON.parse try/catch toegevoegd in `retryWithAnthropicFix`
- Fase 2 draft API endpoint gebouwd: `POST /api/dba/analyse/[id]/draft`

*Security:*
- Debug endpoint `/api/debug/ai-test/` verwijderd (was publiek toegankelijk)
- Rate limiting geimplementeerd op het analyse endpoint: free 20/dag, pro 100/dag, enterprise 500/dag

*UX:*
- `needs_more_input` blokkade verwijderd: analyse altijd uitvoeren bij voldoende tekst, ontbrekende signalen tonen als invulvelden
- Follow-up vragen als invulvelden op de resultaatpagina, met heranalyse op gecombineerde tekst
- Draft generatie alleen op expliciete knopklik, geen auto-trigger meer
- Premium UI voor de resultaatpagina: hero banner met risicoscore, 3-koloms domeinkaarten, actiepunten
- isFallback-check toegevoegd met eigen foutscherm

**Uitdagingen:**
De nuclear validator voelde aanvankelijk als een compromis, maar was de enige realistische oplossing: Haiku is niet deterministisch genoeg voor strikte Zod-validatie zonder dat elke kleine afwijking resulteert in een fallback-scherm. De twee-fase architectuur vereiste ook een heroverweging van de database-structuur om fase 2-resultaten los op te slaan van fase 1.

**Tijdsinschatting (mens):** 8 uur

---

## 4. Draft generatie gesplitst in compact en uitgebreid (2026-04-08)

**Toelichting:**
De gecombineerde draft-prompt (compact modelovereenkomst + uitgebreide versie) duurde 15-20 seconden. Dat was onaanvaardbaar als je op een knop klikt en wacht. Ik heb de generatie opgesplitst in twee aparte modi zodat de meest gebruikte variant (compact) direct klaar is.

**Taken uitgevoerd:**
- `buildDbaDraftGenerationPrompt` gesplitst in `buildCompactDraftPrompt` (max_tokens 700) en `buildFullDraftPrompt` (max_tokens 2000)
- `generateAssignmentDraft` uitgebreid met `mode: 'compact' | 'full'` parameter
- Draft endpoint uitgebreid met `?mode=compact|full` query parameter (standaard: compact)
- UI aangepast: compact laadt direct bij "Genereer"-klik, uitgebreid laadt lazy bij eerste tab-klik
- KI-004 gedocumenteerd: rate limit correctie (3/dag naar 20/dag)

**Uitdagingen:**
Het lastige was de lazy loading goed te implementeren zodat de uitgebreide versie pas wordt opgehaald als de gebruiker er daadwerkelijk op klikt, zonder dat dit tot race conditions leidt als de gebruiker snel wisselt.

**Tijdsinschatting (mens):** 3 uur

---

## 5. PDF-rapport, Loops quick-scan en Stripe-fixes (2026-04-08)

**Toelichting:**
Een zware sessie met drie losse workstreams die allemaal gelijktijdig aandacht vroegen: het PDF-rapport werkte niet correct, de Loops quick-scan endpoint ontbrak, en er waren meerdere Stripe-bugs die de betaalflow blokkeerden.

**Taken uitgevoerd:**

*PDF-rapport (6 fixes + volledige redesign):*
- pdfkit toegevoegd aan `serverExternalPackages` in `next.config.ts` (PDF kon niet renderen in Next.js serveromgeving)
- `parseDraftJson` helpers toegevoegd zodat de draft-inhoud leesbaar wordt in het PDF in plaats van ruwe JSON
- Domeinnamen in PDF gecorrigeerd: `d.title ?? d.domainName ?? d.key` in plaats van altijd "Domein"
- Logo-pad gecorrigeerd: `dba-kompas-logo.png` naar `logo-flat-white.png`
- `max_tokens` voor full draft verhoogd van 1400 naar 2000 (tekst werd afgekapt)
- Volledige PDF redesign: cream achtergrond op alle pagina's, exacte underlines, inline risicoscore, `truncateSentence()` helper, `renderDraftCol()` helper, `autoFirstPage: false`

*Loops quick-scan:*
- `/api/loops/quick-scan` endpoint gebouwd: contact aanmaken/updaten in Loops + `quick_scan_completed` event sturen met risiconiveau
- Quick Scan success screen aangepast: "Ga verder" naar `/auth/signup`, "Bekijk wat DBA Kompas biedt" naar `/#pricing`

*Stripe-fixes:*
- `buildFollowUpQuestions` importfout opgelost in `dbaAnalysis.ts` (elke analyse gaf "Internal server error")
- `STRIPE_ONE_TIME_DBA_PRICE_ID` gecorrigeerd naar `STRIPE_PRICE_ID_ONE_TIME` (one-time checkout gaf altijd HTTP 500)
- `trialing` status toegevoegd als actief Pro-plan in `getUserPlan()`
- Dashboard succesbanner geimplementeerd na Stripe checkout: detecteert `?session_id=`, cleant URL daarna

*Tests:*
- End-to-end analyse flow getest (TEST-001): stabiel na import-fix
- PDF download getest (TEST-004): correct na alle PDF-fixes

**Uitdagingen:**
De PDF-redesign kostte meer tijd dan verwacht omdat pdfkit anders met pagina-layout omgaat dan je zou verwachten vanuit CSS. Elke visuele aanpassing vereiste herhaalbare renderingscycli om het resultaat te controleren. De Stripe-bugs waren relatief eenvoudig zodra ik de oorzaak had gevonden, maar het debuggen kostte tijd omdat de foutmeldingen niet direct wezen naar de env var mismatch.

**Tijdsinschatting (mens):** 10 uur

---

## 6. Conversie-funnel hersteld en modal geconsolideerd (2026-04-09, ochtend)

**Toelichting:**
De volledige conversie-funnel was gebroken: de registratie- en checkoutpagina's bestonden niet, de modal deed een redirect die niet werkte, en de Supabase-configuratie stuurde verificatiemails naar localhost. Ik heb de funnel van begin tot eind opnieuw opgebouwd en geconsolideerd.

**Taken uitgevoerd:**
- `app/register/page.tsx` gebouwd: volledig signup en checkout formulier, pre-filled email en plan via query params, directe checkout als sessie al beschikbaar, `emailRedirectTo` naar `/checkout-redirect` als verificatie vereist
- `app/checkout-redirect/page.tsx` gebouwd: auto-triggert checkout API na e-mailverificatie via de `/auth/callback?next=...` flow
- `app/auth/signup/page.tsx` gebouwd: server-side redirect naar `/login` (wordt aangesproken vanuit de Quick Scan success screen)
- `/api/billing/checkout` uitgebreid met `plan`-lookup: client geeft plan-naam mee, server zoekt price ID op via env vars
- `cancel_url` gecorrigeerd in beide checkout routes: van `/pricing` (gaf 404) naar `/dashboard`
- `EmailCheckoutModal` geconsolideerd: `supabase.auth.signUp()` direct in de modal, geen redirect naar `/register` meer; verifyscherm inline in modal; knoptekst "Account aanmaken & betalen"; footer "Al een account? Inloggen"
- Supabase Site URL gecorrigeerd van `localhost:3000` naar `https://dba-kompas.vercel.app`
- Redirect URL `https://dba-kompas.vercel.app/**` toegevoegd aan de Supabase allowlist
- Supabase verificatiemail voorzien van DBA Kompas huisstijl via custom HTML template

**Uitdagingen:**
Het consolideren van de modal was verrassend complex vanwege de state-machine achter de stappen: plan selectie, email/wachtwoord, verificatiescherm en sessie-afhankelijke routing moesten allemaal correct samenwerken. De `emailRedirectTo`-flow via `/checkout-redirect` was noodzakelijk omdat Supabase de sessie pas na e-mailverificatie beschikbaar maakt, wat betekent dat je de checkout pas daarna kunt starten.

**Tijdsinschatting (mens):** 5 uur

---

## 7. Paywall, one-time upsell, tests en deployment docs (2026-04-09, middag/avond)

**Toelichting:**
Een zware sessie die vier losse onderdelen combineerde: de paywall implementeren zodat onbetaalde gebruikers geen toegang meer hebben, de upsell-flow bouwen voor one-time kopers die willen upgraden naar een abonnement, 67 geautomatiseerde tests schrijven, en de deployment-configuratie documenteren.

**Taken uitgevoerd:**

*Paywall (FEAT-004):*
- `getUserPlan()` uitgebreid: checkt nu ook `one_time_purchases` naast `subscriptions`
- `GET /api/user/plan` endpoint gebouwd
- `AuthContext` uitgebreid met `plan`, `planLoading` en `refreshPlan`
- `AppShell` in `app/(app)/layout.tsx` uitgebreid: redirect naar `/upgrade` als plan gelijk is aan free, met uitzondering voor `/profiel`
- `/upgrade` paywallpagina gebouwd: drie plankaarten met directe Stripe checkout

*One-time upsell en upgrade-flow (FEAT-005):*
- `sendOneTimeUpsellEmail()` gebouwd via Resend: verstuurd na `one_time_purchases` INSERT door de webhook
- `/upgrade-to-pro` gebouwd als server component: authenticatiecheck, conflictcheck (geen dubbel abonnement), coupon-check, directe Stripe redirect
- Stripe coupon `ONETIMECREDIT` aangemaakt in test mode: 9,95 euro korting, eenmalig, op de eerste factuur
- `STRIPE_COUPON_ONE_TIME_UPGRADE=ONETIMECREDIT` ingesteld als Vercel env var

*Tests (QUAL-001 en QUAL-002):*
- Vitest 2.1.0 ingericht als testframework (native TypeScript en ESM, geen Babel nodig)
- `__tests__/validateDbaInput.test.ts`: 23 tests voor countWords, detectSignals, validateDbaInput, buildFollowUpQuestions
- `__tests__/validateDbaEngineOutput.test.ts`: 23 tests voor de nuclear coercion validators
- `__tests__/analyzeDbaText.test.ts`: 21 integratietests voor analyzeDbaText en generateAssignmentDraft, met Anthropic SDK gemockt via vi.hoisted

*Deployment (DOC-001):*
- `vercel.json` aangemaakt: regio fra1 (Frankfurt, GDPR), www-redirect naar canonical domein
- `docs/DEPLOYMENT.md` aangemaakt: alle env vars gedocumenteerd, Stripe webhook configuratie, productielaunch checklist
- `.env.local.example` gecorrigeerd: verkeerde env var naam gecorrigeerd

*Stripe live testen:*
- Stripe webhook `dba-kompas-vercel-test` geconfigureerd in Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` ingesteld in Vercel
- Echte checkout uitgevoerd met testkaart: `billing_events`, `subscriptions` en `profiles` alle drie correct bijgewerkt (TEST-002 en TEST-003 bevestigd)

**Uitdagingen:**
De Vitest mock-strategie voor de Anthropic SDK was de moeilijkste puzzel: de SDK is een module-level singleton, wat betekent dat je `vi.hoisted()` nodig hebt om de mock te declareren voordat de module wordt geimporteerd. Standaard `vi.mock()` werkte hiervoor niet. De coupon-logica voor de upgrade-flow vereiste ook zorgvuldige server-side afhandeling zodat de coupon ID nooit op de client terechtkomt.

**Tijdsinschatting (mens):** 10 uur

---

## 8. DNS-migratie naar Cloudflare (INFRA-001) (2026-04-10, ochtend)

**Toelichting:**
Aanleiding was dat STRATO geen subdomain MX-records ondersteunt, wat nodig was voor Resend e-mailverificatie. Ik heb besloten om de volledige DNS naar Cloudflare te migreren in plaats van te proberen binnen de beperkingen van STRATO te werken.

**Taken uitgevoerd:**
- Analyse van STRATO DNS-beperkingen: subdomain MX niet mogelijk zonder de root MX te wijzigen (wat inkomende mail zou breken)
- Besluit vastgesteld: volledige DNS-migratie naar Cloudflare
- Cloudflare free account aangemaakt, domein `dbakompas.nl` toegevoegd
- Automatisch geimporteerde DNS-records gecontroleerd: A, CNAME, MX, TXT, SRV
- Resend MX-record toegevoegd in Cloudflare: `send` naar amazonses.com, prioriteit 10
- DNSSEC-deactivatie aangevraagd bij STRATO (status: "Wordt gedeactiveerd")
- Documentatie bijgewerkt met exacte vervolgstappen voor de NS-wissel

**Uitdagingen:**
DNSSEC moet volledig gedeactiveerd zijn voordat de NS-records gewijzigd kunnen worden. Dit is een asynchrone actie bij STRATO die meerdere uren kan duren. Hierdoor kon de NS-wissel nog niet worden doorgevoerd, wat de rest van de livegang-stappen blokkeert.

**Tijdsinschatting (mens):** 4 uur

---

## 9. Loops e-mailsequenties v2 herschreven (9 emails) (2026-04-10, middag)

**Toelichting:**
De bestaande e-mailteksten sloten niet goed aan op de werkelijke beperking van de Quick Scan (5 meerkeuze-vragen is een indicatie, geen juridisch oordeel). Alle 9 emails zijn volledig herschreven: eerlijk over de beperkingen, met voldoende urgentie, en het maandabonnement gepositioneerd als kennisbron over DBA-wetgeving.

**Taken uitgevoerd:**
- Positionering bepaald voor alle drie risiconiveaus: hoog, gemiddeld en laag
- Sequentie A (hoog risico): A1 dag 0, A2 dag 4, A3 dag 11, volledig herschreven
- Sequentie B (gemiddeld risico): B1, B2, B3, volledig herschreven
- Sequentie C (laag risico): C1, C2, C3, volledig herschreven; maandabonnement als primaire CTA in C2 en C3
- CTA-URLs opgesteld met merge tag: `https://dbakompas.nl/register?plan=one_time_dba&email={contact.email}`
- Word-document gegenereerd: `DBA Kompas - Loops e-mailsequenties v2.docx`

**Uitdagingen:**
De balans vinden tussen eerlijkheid ("vijf vragen is geen oordeel") en urgentie ("maar er zijn wel signalen die je serieus moet nemen") zonder de lezer in paniek te brengen of onterecht gerust te stellen. Voor de laag-risico reeks was de positionering anders van aard: niet "je hebt mogelijk een probleem" maar "wetgeving verandert continu, blijf op de hoogte."

**Tijdsinschatting (mens):** 7 uur

---

## 10. Technische analyse Loops-integratie (2026-04-10, middag)

**Toelichting:**
Voordat ik de journeys bouwde, heb ik de bestaande code doorgelezen om te begrijpen wat er al geimplementeerd was en hoe Loops samenhangt met Stripe, Resend en de registratiepagina.

**Taken uitgevoerd:**
- `lib/loops/index.ts` geanalyseerd: `updateLoopsContact()` en `sendLoopsEvent()`
- `app/api/billing/webhook/route.ts` geanalyseerd: welke events al naar Loops worden gestuurd
- `app/register/page.tsx` geanalyseerd: hoe `plan` en `email` query parameters worden verwerkt
- `modules/email/send.ts` geanalyseerd: rolverdeling tussen Resend (transactioneel) en Loops (lifecycle)
- Vastgesteld dat `subscription_status` contact property al correct wordt bijgewerkt bij betaling via de Stripe webhook
- Vastgesteld dat de Loops merge tag syntax `{contact.email}` is (een haakjeset in de editor)
- KI-018 gedocumenteerd: digest emails zijn geimplementeerd maar hebben geen trigger

**Tijdsinschatting (mens):** 2,5 uur

---

## 11. Loops journeys A, B en C aanmaken en configureren (2026-04-10, avond)

**Toelichting:**
Drie nieuwe Loops-journeys aangemaakt in het Loops dashboard. Elke journey volgt dezelfde flow-architectuur: trigger op `quick_scan_completed`, audience filter op risiconiveau, drie emails met timers ertussen en conversiestop-logica.

**Taken uitgevoerd:**

*Journey aanmaken (alle drie):*
- Naam, trigger (`quick_scan_completed`, frequency: One time) en audience filter per risiconiveau ingesteld
- Drie Send email nodes per journey toegevoegd
- Timer nodes toegevoegd: 4 dagen tussen email 1 en 2, 7 dagen tussen email 2 en 3

*E-mails ingevoerd (voor alle drie journeys):*
- Subject, preview text en body ingevoerd per email node
- CTA-buttons aangemaakt als Button blocks (niet als platte links)
- Button URL tijdelijk op Vercel-URL, wordt `dbakompas.nl` bij livegang
- Fallback voor merge tag email-veld: spatie

*Conversiestop-logica:*
- Branch node toegevoegd na elke Send email (behalve de laatste)
- Audience filter na Branch: `subscription_status does not equal "active"`, scope: All following nodes
- Geconverteerde contacts ontvangen de resterende emails niet

**Uitdagingen:**

*Loops heeft geen Goal-functie:* ik dacht dat er een aparte instelling was om de flow te stoppen bij conversie. Die bestaat niet. Oplossing: Audience filter na elke Branch met de subscription_status check.

*Validatiefout "Extra node does not ultimately lead to any emails sent":* de "active"-tak van de Branch wees naar een Audience filter die nergens naartoe leidde. Opgelost door de Audience filter op de active-tak te verwijderen.

*Extra filter "User group equals ''" onbedoeld toegevoegd:* filterde contacts met een ingestelde user group eruit. Verwijderd uit alle Audience filter nodes.

*Timer stond op 5 dagen in plaats van 4:* waarde niet correct opgeslagen, gecorrigeerd.

**Tijdsinschatting (mens):** 10 uur

---

## 12. Journey B testen en activeren (2026-04-10, avond)

**Toelichting:**
Journey B (gemiddeld risico) als eerste live gezet en getest via de "Send test" functie in de Loops email composer.

**Taken uitgevoerd:**
- Journey B geactiveerd via de "Resume"-knop
- B1 email Send test verstuurd naar eigen e-mailadres en ontvangen
- Opmaak en CTA-button gecontroleerd: correct, klikbaar, leidt naar de registratiepagina met correct plan
- Vastgesteld dat `{contact.email}` in de URL pas vervangen wordt bij echte Loops-verzending (expected behavior)
- Journey A en C bewust op Draft gelaten: activeren bij livegang `dbakompas.nl`

**Tijdsinschatting (mens):** 1 uur

---

## 13. Documentatie en projectregistratie synchroniseren (doorlopend)

**Toelichting:**
Na elke sessie heb ik alle projectdocumenten bijgewerkt zodat de volgende sessie direct kan doorgaan zonder contextverlies.

**Taken uitgevoerd:**
- `PROJECT_STATE.md` actueel gehouden na elke sessie
- `TASKS.md` bijgehouden: taken van TODO naar DONE verplaatst, nieuwe taken toegevoegd
- `DECISIONS.md` bijgehouden: alle architectuurbesluiten vastgelegd met reden en alternatieven
- `INTEGRATIONS_STATUS.md` bijgehouden: status per integratie per sessie bijgewerkt
- `KNOWN_ISSUES.md` bijgehouden: nieuwe issues toegevoegd, opgeloste issues gesloten
- Meerdere git commits aangemaakt (commits `a976d4c`, `92ea711`, `ae44683`, `b1569d3`, `910ce2d`, `a8c4268`, `a5bff30`, `7c13cc5`, `5f63a53`, `6477615`, `779619e`, `4ba0c6e`, `7ceea92`)

**Tijdsinschatting (mens):** 4 uur

---

## 14. NS-wissel STRATO naar Cloudflare voltooien + LOOPS-002 afronden (2026-04-11)

**Toelichting:**
DNSSEC was al gedeactiveerd in de vorige sessie. In deze sessie heb ik de NS-records definitief omgezet en alle openstaande Loops-taken afgerond. De DNS-propagatie loopt nog op het moment van afsluiten.

**Taken uitgevoerd:**

*INFRA-001 voortgezet:*
- Bevestigd dat DNSSEC "niet actief" staat in STRATO
- NS-records in STRATO omgezet naar `brett.ns.cloudflare.com` en `peaches.ns.cloudflare.com`
- Cloudflare "Check nameservers now" gestart, propagatie lopend
- CRON_SECRET aangemaakt via `openssl rand -base64 32` en toegevoegd als env var in Vercel Dashboard
- Vercel project geredeployed na toevoeging CRON_SECRET
- Resend domain status gecontroleerd: staat op "Failed" door eerdere verificatiepoging voor NS-wissel, wordt herbevestigd zodra Cloudflare actief is

*LOOPS-002 afgerond:*
- Alle 9 CTA-URLs in Loops omgezet van `dba-kompas.vercel.app` naar `dbakompas.nl`
- Journey A "Hoog risico" geactiveerd
- Journey C "Laag risico" geactiveerd
- Journey B was al actief

**Uitdagingen:**
DNS-propagatie bij STRATO duurt langer dan verwacht. DNSChecker toonde nog de oude STRATO-nameservers, maar de STRATO-interface bevestigde dat de juiste Cloudflare-waarden al zijn opgeslagen. Dit is een TTL-kwestie waarbij de globale DNS-cache moet verlopen. Er is geen actie mogelijk anders dan wachten.

**Tijdsinschatting (mens):** 2,5 uur

---

## Totaaloverzicht

| # | Werkzaamheid | Datum | Uren |
|---|---|---|---|
| 1 | Architectuurdocumenten opstellen (bouwstraat) | Voor 2026-04-07 | 6,0 |
| 2 | Migratie van Replit naar Next.js | Voor 2026-04-07 | 25,0 |
| 3 | Stabilisatie, security en UX-verbeteringen | 2026-04-07 | 8,0 |
| 4 | Draft generatie gesplitst in compact en uitgebreid | 2026-04-08 | 3,0 |
| 5 | PDF-rapport, Loops quick-scan en Stripe-fixes | 2026-04-08 | 10,0 |
| 6 | Conversie-funnel hersteld en modal geconsolideerd | 2026-04-09 | 5,0 |
| 7 | Paywall, one-time upsell, tests en deployment docs | 2026-04-09 | 10,0 |
| 8 | DNS-migratie naar Cloudflare (INFRA-001) | 2026-04-10 | 4,0 |
| 9 | Loops e-mailsequenties v2 herschreven (9 emails) | 2026-04-10 | 7,0 |
| 10 | Technische analyse Loops-integratie | 2026-04-10 | 2,5 |
| 11 | Loops journeys A, B en C aanmaken en configureren | 2026-04-10 | 10,0 |
| 12 | Journey B testen en activeren | 2026-04-10 | 1,0 |
| 13 | Documentatie en projectregistratie (doorlopend) | Doorlopend | 4,0 |
| 14 | NS-wissel Cloudflare + LOOPS-002 afronden | 2026-04-11 | 2,5 |
| | **Totaal** | | **98,0** |
