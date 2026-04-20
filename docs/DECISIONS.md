# DECISIONS.md
**Architectuurbeslissingen logboek**

Elke beslissing bevat: datum, beslissing, reden, alternatieven overwogen.

---

## 2026-04-20 — KI-020: Guest-email checkout + magic link login

**Beslissing:** De kern-koopflow voor nieuwe bezoekers gaat niet meer via account-first (registreren + wachtwoord + e-mailbevestiging + inloggen + pakket kiezen + Stripe). In plaats daarvan: bezoeker klikt Koop, vult alleen e-mail in, wordt direct naar Stripe gestuurd. Pas na succesvolle betaling maakt de webhook de Supabase auth-user aan (via `admin.createUser` met `email_confirm: true`). De welkomstmail bevat een magic link waarmee de klant in een klik ingelogd op het dashboard staat.

**Mechanisme:**
- `lib/auth/provision-user.ts` is de single-source-of-truth voor post-payment user-provisioning. Lookup op `profiles.email` (lowercase genormaliseerd); bestaand -> magic link voor bestaande userId; nieuw -> `admin.createUser` + magic link. De bestaande `on_auth_user_created` trigger vult automatisch `public.profiles`.
- Twee nieuwe publieke endpoints: `/api/billing/checkout-guest` (subscription) en `/api/one-time/checkout-guest` (eenmalig). Geen auth-vereiste. Stripe session krijgt `customer_email` + `metadata.guest_email` + `metadata.guest_flow = 'true'`.
- `handleCheckoutCompleted` in de webhook ziet bij ontbrekende `metadata.user_id` de `metadata.guest_email` en roept `provisionUserForCheckout` aan. Idempotent via `billing_events` dedup.
- Welkomstmail-module (`modules/email/send.ts`) krijgt `magicLink` parameter, gezet als `TemplateModel.login_link`. Postmark-templates moeten handmatig worden aangepast om de CTA-knop te laten verwijzen naar `{{ login_link }}`.

**Reden:**
- Bezoekers haken af op de account-first flow (6 schermen). Commerciële conversie is kritiek pre-launch.
- Betaling is sterker eigendomsbewijs dan een bevestigingsmail: wie de kaart gebruikt heeft evident toegang tot het e-mailadres (Stripe stuurt bonnetje) of is de kaarthouder.
- Magic link maakt eerste login een 1-klik ervaring. Geen onthoud-je-wachtwoord frictie. Klant kan later alsnog wachtwoord instellen via `/update-password`.

**Alternatieven overwogen:**
- Stripe-only email (Stripe vraagt zelf om e-mail): nog korter, maar we verliezen controle over de terms-of-service acceptatie-moment en over de UI-copy tussen klik en betaling.
- Complete rewrite naar passwordless overal: te grote scope voor deze sprint; bestaande password-based `/register` en `/login` blijven intact voor dev/admin-paden en voor klanten die later een wachtwoord willen instellen.

**Beveiliging:**
- Guest-endpoints valideren alleen e-mail + plan, creeren geen user. User-creatie gebeurt uitsluitend in de webhook na verifieerde Stripe signature.
- Bestaande e-mailadres in profiles -> geen dubbele user, aankoop wordt gekoppeld aan bestaande account. Voorkomt dat iemand een bestaand account kan "overnemen" door te betalen.
- Magic link TTL: Supabase default (1 uur). Klant kan nieuwe link opvragen via `/login`.

**Verouderde entry:** De entry over Resend-templates (2026-04-13) is ingehaald door de Postmark-migratie (sessie 17-18). Welkomstmails draaien nu via Postmark aliases `welkomstmail-eenmalig | welkomstmail-maand | welkomstmail-jaar` en moeten een `{{ login_link }}` variabele krijgen.

---

## 2026-04-20 — KI-020-A: Activate-flow + magic-link click-through pages

**Status:** Amendement op KI-020. Het KI-020-principe (guest-email checkout, user-provisioning na betaling) blijft ongewijzigd. Wat verandert is hoe we de klant vanuit de welkomstmail naar het dashboard leiden.

**Beslissing:** De welkomstmail stuurt de klant niet meer direct naar een rauwe Supabase-magic-link. In plaats daarvan bevat de mail twee CTA's naar eigen domein:
- Primair: `/auth/activate/<token>` -> klant stelt zelf een wachtwoord in, wordt direct ingelogd, komt in dashboard.
- Secundair: `/auth/welcome/<token>` -> klant klikt en wordt via een verse, server-gegenereerde Supabase-magic-link ingelogd zonder wachtwoord.

Beide URL's delen hetzelfde welcome-token. Het token is stateful (DB-row in `public.welcome_tokens`) en daardoor volledig traceerbaar en herstelbaar vanuit Supabase.

**Mechanisme:**
- `lib/auth/welcome-token.ts`: stateless HMAC-SHA256 helper met `signWelcomeToken` / `verifyWelcomeToken`. Payload: `{jti, userId, email, exp}`. TTL 24 uur (langer dan Supabase-default 1u; ruimer venster voor klant). Env: `WELCOME_TOKEN_SECRET` (min 32 tekens, random).
- `lib/auth/welcome-token-server.ts`: server-only wrapper met DB-state. Exports `issueWelcomeToken` (insert + sign), `validateWelcomeToken` (signature + expiry + used/revoked checks), `markWelcomeTokenUsed` (markeert + revokes andere openstaande tokens voor zelfde user).
- Migration `006_welcome_tokens.sql` creëert `public.welcome_tokens` (jti PK, user_id, email, created_at, expires_at, used_at, used_ip, used_purpose, revoked_at, revoke_reason). RLS aan, geen policies: uitsluitend service-role toegang.
- `app/auth/activate/[token]/page.tsx` + `ActivateForm.tsx` + `actions.ts`: wachtwoord-instel-scherm met policy "min 10 tekens + mix upper/lower/digit/special". Submit = server action die token valideert, `admin.updateUserById({password})` uitvoert, token als used markeert (purpose='activate'), server-side `signInWithPassword` doet, en `redirect('/dashboard')` buiten try/catch.
- `app/auth/welcome/[token]/page.tsx` + `WelcomeForm.tsx` + `actions.ts`: "direct inloggen zonder wachtwoord"-scherm. Submit = server action die token valideert, `admin.generateLink({type:'magiclink'})` aanroept, token markeert (purpose='magiclink'), en `redirect(actionLink)` doet naar Supabase verify-URL.
- `lib/auth/provision-user.ts` returnt nu `{userId, activateUrl, loginUrl, isNew}`. Beide URL's delen hetzelfde token.
- `modules/email/send.ts` accepteert `{activateLink, loginLink}` en mappt naar Postmark `TemplateModel.activate_link` + `TemplateModel.login_link`.
- `app/login/page.tsx` detecteert nu `?error=auth_callback_error` (querystring) én `#error_code=otp_expired` (hash) en toont een banner + schakelt direct naar magic-link-mode. Hash wordt opgeruimd via `history.replaceState`.

**Reden:**
- Gmail's SafeBrowsing-scanner prefetcht links in mail vóór de klant klikt. Bij een rauwe Supabase-magic-link verbruikt die prefetch het single-use token; de klant klikt vervolgens op een al-gebruikte link en krijgt `otp_expired` + redirect naar `/login`. Dit werd geobserveerd in sessie 18 (TEST-006).
- Click-through pages op eigen domein zijn POST-only voor het token-verbruik: de GET (prefetch) toont alleen een vriendelijke pagina; pas de POST (formulier-submit) genereert de Supabase-magic-link of wijzigt het wachtwoord. Gmail prefetcht geen POSTs.
- Gebruiker heeft expliciet aangegeven dat de conversie al verricht is bij de welkomstmail en dat een wachtwoord-instel-stap op dat moment logisch voelt. Activate-flow wordt primair, magic-link blijft als "geen-wachtwoord-nodig"-alternatief.
- Stateful tokens via `welcome_tokens` maken de flow traceerbaar (audit) en herstelbaar (revocation). Bij misbruik kan de admin een token handmatig revoked markeren vanuit Supabase Studio.

**Alternatieven overwogen:**
- Alleen wachtwoord-flow (zonder magic-link fallback): onvriendelijk voor klanten die geen wachtwoord willen en gewoon snel willen inloggen.
- Alleen magic-link met `ttl=0`-hack of wildcard-whitelist: geen stabiele oplossing tegen Gmail prefetch, en Supabase-defaults bieden hier geen grip op.
- Stateless tokens zonder DB-row: eenvoudiger, maar niet traceerbaar/revocable zoals expliciet gewenst door gebruiker ("als het maar altijd te tracken en te herstellen is vanuit supabase").
- Twee aparte tokens (één voor activate, één voor magic-link): onnodig complex; één token werkt omdat de klant sowieso maar één pad kiest, en `markWelcomeTokenUsed` revoked het token in beide takken.

**Beveiliging:**
- Token-signing via HMAC-SHA256 met server-only secret. `timingSafeEqual` voor signature-vergelijking. Base64URL encoding.
- TTL 24 uur; na gebruik direct gemarkeerd in DB en andere openstaande tokens voor dezelfde user automatisch gerevokeerd.
- RLS aan op `welcome_tokens` zonder policies: onbereikbaar voor anon/authenticated rollen, alleen service-role (webhook + server actions) mag lezen/schrijven.
- Wachtwoord-policy: minimaal 10 tekens + hoofdletter + kleine letter + cijfer + speciaal teken. Gevalideerd server-side vóór `updateUserById`.
- Magic-link-tak genereert pas een verse Supabase-magic-link op de POST-submit; de URL wordt nooit in e-mail of server-log gezet.
- `'server-only'` import-guard op `welcome-token-server.ts` zodat admin-secret en DB-access niet per ongeluk bundle-shipped worden.

**Observability:**
- `welcome_tokens.used_purpose` (`'activate' | 'magiclink'`) maakt splitsing zichtbaar voor de eerste week. Verwachting: >60% kiest activate.
- `welcome_tokens.used_ip` voor audit bij vermoedens van accountovername.
- Webhook-failures blijven naar Sentry + `admin_alerts` gaan zoals in KI-020 vastgelegd.

**Migratiestappen:**
1. Env `WELCOME_TOKEN_SECRET` (min 32 random chars) toevoegen aan Vercel (alle environments).
2. Migration `006_welcome_tokens.sql` draaien in Supabase Studio.
3. Postmark templates `welkomstmail-eenmalig | -maand | -jaar` krijgen primaire CTA `{{ activate_link }}` ("Activeer je account") + secundaire tekst-link `{{ login_link }}` ("Liever direct inloggen zonder wachtwoord? Klik hier.").
4. Deploy, hertest TEST-006 B1/B2/B3.

---

## 2026-04-13 — Nederlandstalige foutmeldingen via centrale vertaalfunctie

**Beslissing:** Supabase Auth geeft altijd Engelse foutmeldingen terug. Deze worden vertaald via een centrale `translateAuthError(message)` functie in `lib/auth-errors.ts`.

**Mechanisme:**
- `translateAuthError` ontvangt de Engelse error message string van Supabase
- Bekende patronen worden gematcht en vertaald naar Nederlands
- Fallback: "Er is een fout opgetreden. Probeer het opnieuw."
- Gebruikt in `EmailCheckoutModal.tsx` en `app/register/page.tsx`

**Reden:**
- Supabase biedt geen native i18n voor Auth errors
- Engelse foutmeldingen zijn onprofessioneel voor een Nederlandstalige doelgroep
- Centrale aanpak voorkomt verspreide if/else blokken per component

**Alternatieven overwogen:**
- Per-component if/else vertaling: te verspreid, lastig onderhouden
- Supabase custom error messages: niet beschikbaar via standaard Auth config

---

## 2026-04-13 — Welkomstmails via Resend Templates met inline HTML fallback

**Beslissing:** Welkomstmails worden verstuurd via Resend Templates (beheersbaar via Resend dashboard). Als een template ID ontbreekt in env vars, valt de code terug op inline HTML.

**Template IDs:**
- `RESEND_TEMPLATE_WELCOME_ONE_TIME`: `103d7be2-e2a6-48e6-9c29-5db48de2b338`
- `RESEND_TEMPLATE_WELCOME_MONTHLY`: `11387950-bdd2-4e81-bf5c-fde9f60d1baa`
- `RESEND_TEMPLATE_WELCOME_YEARLY`: `02824f32-0da5-407c-b44e-3b89c0ea2d52`

**Reden:**
- Resend Templates zijn bewerkbaar via dashboard zonder deployment
- Resend heeft geen public REST API voor template aanmaak — handmatig aangemaakt via dashboard
- Inline HTML fallback zorgt dat e-mails werken ook zonder template env vars (lokale dev)

**Alternatieven overwogen:**
- Altijd inline HTML: minder flexibel, elke copy-wijziging vereist deployment
- Loops voor welkomstmails: Loops is voor marketing automation, niet voor transactionele betalingsbevestigingen

---

## 2026-04-13 — Welkomstmail copy: geen limieten, geen WTTA

**Beslissing:** Welkomstmails vermelden geen analyse-limieten en geen WTTA-referentie.

**Reden (limieten):**
- `BILLING-002` (analyse-limieten) is nog niet gebouwd — limieten zijn nu nog niet van toepassing
- Als limieten later worden geïntroduceerd, worden de templates via Resend dashboard bijgewerkt

**Reden (WTTA):**
- De welkomstmail is niet de plek voor productuitleg — één taak: gebruiker naar dashboard krijgen
- WTTA-nieuws ontdekken gebruikers vanzelf in het product

**Reden (geen "onbeperkt"):**
- "Onbeperkt" is een belofte — met BILLING-002 in de backlog is dit prematuur
- Neutrale formulering ("je hebt toegang tot DBA-analyses") is toekomstbestendig

---

## 2026-04-13 — BILLING-002: briefing-eerst aanpak

**Beslissing:** `BILLING-002` (analyse-limieten + credit top-up) wordt NIET gebouwd zonder voorafgaande briefingsessie.

**Werkwijze:**
1. Begin sessie: schets het model (kosten/baten, limieten per plan, bundelkeuzes)
2. Bespreek openstaande keuzes (doorrol credits, bundels vs. losse credits, harde/zachte blokkade)
3. Pas dan: implementatie stap voor stap met begeleiding

**Reden:**
- Verkeerde aannames hier kosten twee keer werk
- Business impact (API-kosten vs. gebruikersretentie) moet eerst helder zijn

---

## 2026-04-12 — DNS migratie naar Cloudflare (INFRA-001)

**Beslissing:** DNS van `dbakompas.nl` wordt beheerd via Cloudflare, niet meer via STRATO.

**Reden:**
- STRATO biedt geen wildcard MX-records en ondersteunt geen subdomein-specifieke MX-records (nodig voor Loops `envelope` subdomain)
- Cloudflare Free biedt CNAME-flattening op root-domein, DDoS-beveiliging, snelle propagatie
- Cloudflare maakt DNS-beheer eenvoudiger en visueler dan STRATO

**Mechanisme:**
- STRATO NS-records gewijzigd naar `brett.ns.cloudflare.com` + `peaches.ns.cloudflare.com`
- Cloudflare importeerde automatisch alle bestaande DNS-records vanuit STRATO
- Vercel custom domain: CNAME-flattening op root (`@`) naar Vercel-specifieke CNAME — Cloudflare proxy uitgeschakeld (grijs wolk)
- Apple Mail (STRATO IMAP/SMTP) onaangetast: MX-records voor `dbakompas.nl` intact, SPF-record gecombineerd

**SPF-record (gecombineerd):**
`v=spf1 include:amazonses.com include:_spf.strato.com ~all`
- `include:amazonses.com` dekt Resend (verstuurt via Amazon SES)
- `include:_spf.strato.com` dekt Apple Mail / STRATO outbound

**Alternatieven overwogen:**
- STRATO DNS behouden: blokkeerde Loops envelope-subdomain MX
- Andere DNS-providers (Hetzner, TransIP): niet overwogen — Cloudflare Free voldoet volledig

---

## 2026-04-12 — Loops sending domain gewijzigd naar root dbakompas.nl

**Beslissing:** Loops verstuurt e-mails vanuit `dbakompas.nl` (root), niet vanuit `app.dbakompas.nl` (subdomain).

**Reden:**
- E-mails vanuit subdomein ogen minder professioneel
- Root domain `dbakompas.nl` sluit aan bij de rest van de communicatie (`noreply@dbakompas.nl`, `info@dbakompas.nl`)

**Vereiste DNS-records (toegevoegd aan Cloudflare):**
- MX voor `envelope.dbakompas.nl` → `feedback-smtp.us-east-1.amazonses.com`, priority 10
- TXT `envelope.dbakompas.nl` → SPF waarde van Loops
- CNAME `loopspk1._domainkey.dbakompas.nl` → DKIM-waarde
- CNAME `loopspk2._domainkey.dbakompas.nl` → DKIM-waarde
- CNAME `loopspk3._domainkey.dbakompas.nl` → DKIM-waarde
- TXT `_dmarc.dbakompas.nl` → DMARC-policy

**Let op — wildcard MX oplossing:**
Cloudflare had een wildcard MX-record (`*`) dat `smtp.rzone.de` (STRATO) retourneerde voor `envelope.dbakompas.nl`. Fix: expliciete MX aangemaakt voor `envelope` subdomain — specifiek record overschrijft wildcard.

---

## 2026-04-12 — Supabase e-mailtemplate: DBA Kompas huisstijl

**Beslissing:** Supabase Confirm signup e-mailtemplate gebruikt volledig eigen HTML met DBA Kompas huisstijl.

**Kenmerken:**
- Achtergrond: donker navy `#1a2332`
- Tekst: wit `#ffffff`, subtekst: `#6b7a8d`
- Lettertype: `Rethink Sans` (met systemfont-fallback)
- CTA-knop: oranje `#d4782a`, wit tekst, border-radius 8px
- Logo: `https://dbakompas.nl/logo-flat-white.png` (tijdelijk nog op Vercel-URL — stap 1 volgende sessie)

**Reden:**
- Supabase standaard template heeft geen branding
- Consistentie met de rest van de DBA Kompas communicatie
- Loops-emails ook in DBA Kompas huisstijl

---

## 2026-04-12 — Resend als Supabase SMTP provider (INFRA-001 AFGEROND)

**Status update:** Beslissing was al vastgelegd op 2026-04-09 als IN PROGRESS. Inmiddels GECONFIGUREERD.

**Wat is gedaan:**
- Supabase SMTP ingesteld: host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key
- Sender name: `DBA Kompas`, sender email: `noreply@dbakompas.nl`
- E-mailbevestiging ingeschakeld in Supabase

**Nog te doen (volgende sessie):**
- `RESEND_API_KEY` env var toevoegen in Vercel (voor transactionele Resend calls vanuit code)
- End-to-end test: verificatiemail ontvangen van `noreply@dbakompas.nl`

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

**Status:** AFGEROND — DNS propagatie voltooid, Cloudflare actief, Resend geverifieerd, Supabase SMTP geconfigureerd (2026-04-12)

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
