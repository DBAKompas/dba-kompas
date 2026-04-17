# Masterplan: DBA Kompas 100% professioneel SaaS

**Aangemaakt:** 2026-04-17
**Status:** Planningsfase — nog niets uitvoeren
**Doel:** App volledig klaarstomen voor marktlancering en groei

---

## Uitgangspunt: wat staat er nu

De app is technisch solide: auth, Stripe, webhooks, AI-analyse, PDF-export, lifecycle, Control Tower. Maar voor een betalende klant die de app opent, is de ervaring vandaag incompleet:

- **Nieuws** — pagina laadt, tabel `news_items` is leeg. Niemand heeft content toegevoegd.
- **Gidsen** — 5 hardcoded teksten van 3-5 alinea's. Niet meer dan wat je op belastingdienst.nl vindt.
- **Notificaties** — tabel bestaat, maar er is geen trigger-systeem dat ze aanmaakt.
- **Documenten** — upload werkt, maar de waarde is onduidelijk t.o.v. de analyse.
- **Growthplan** — referral-engine, URL-tracking en Loops lifecycle-journeys zijn nog niet gebouwd.

Het risico is dat een gebruiker binnenkomt, de analyse doet, en vervolgens naar gidsen gaat die oppervlakkig zijn en een nieuwssectie ziet die leeg is. Dat is geen SaaS — dat is een MVP die nog niet klaar is.

---

## Prioriteit 1 — Kritieke blokkades (vóór lancering)

### PROD-001: Nieuws automatisch vullen

**Probleem:** `news_items` tabel is leeg. Zonder nieuws is de app bij eerste gebruik al half leeg.

**Aanpak:**
Kies één van de twee strategieën:

**Optie A (aanbevolen): Admin nieuws-invoer + Make-automatisering**
- Bouw een eenvoudige admin-pagina `/admin/nieuws` waarmee je zelf nieuwsberichten kunt toevoegen (titel, samenvatting, inhoud, impact, categorie, publicatiedatum)
- Breid tegelijk uit met een Make-scenario dat wekelijks relevante DBA-updates van betrouwbare bronnen scant:
  - `belastingdienst.nl/zakelijk/werken-als-ondernemer`
  - `ftv.nl` (Fiscale Toezicht en Vakblad)
  - `rechtspraak.nl` (recente DBA-uitspraken)
  - `minfin.nl` (ministerie van Financiën)
  - `kvk.nl/actueel`
- Make haalt RSS/pagina op → stuurt naar AI voor samenvatting + impactclassificatie → insert in Supabase

**Optie B (sneller):** Handmatig 15-20 berichten invoeren via Supabase Studio om de pagina initieel te vullen, daarna Make-automatisering toevoegen.

**Bestanden:**
- `app/(app)/admin/nieuws/page.tsx` (nieuw)
- `app/api/admin/nieuws/route.ts` (nieuw — GET lijst + POST nieuw bericht)
- Make-scenario: RSS → AI samenvatting → Supabase insert

---

### PROD-002: Gidsen — diepe, autoritaire content

**Probleem:** Huidige gidsen zijn 3-5 alinea's oppervlakkige samenvatting. Geen enkel verschil met gratis Google-informatie.

**Architectuurkeuze:** Gidsen verplaatsen van hardcoded TypeScript naar Supabase tabel (`guides`), zodat content kan worden bijgewerkt zonder deployment.

**Schema:**
```sql
CREATE TABLE guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  category text,           -- 'dba' | 'fiscaal' | 'administratief' | 'contracten' | 'ondernemen'
  icon text,               -- lucide icon naam
  reading_time_min int,
  difficulty text,         -- 'basis' | 'gevorderd' | 'expert'
  sections jsonb NOT NULL, -- array van { heading, body (markdown) }
  tags text[],
  is_published boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
```

**Gidsen die gebouwd moeten worden (15 stuks, verdeeld over categorieën):**

**DBA & Arbeidsrelaties (5 gidsen)**
1. `wet-dba-compleet` — De volledige Wet DBA: geschiedenis, criteria, handhaving (uitgebreid, 2000+ woorden)
2. `gezagsverhouding-diep` — Gezag herkennen: 12 concrete signalen, jurisprudentie, praktijkvoorbeelden IT en publiek domein
3. `zelfstandigheid-bewijzen` — Hoe bewijs je zelfstandigheid: multi-opdrachtgeversstructuur, materiaalgebruik, aansprakelijkheid, praktijkprotocol
4. `opdrachtomschrijving-handleiding` — Stap-voor-stap handleiding: wat te vermijden, goede clausules, voor/na-voorbeelden per sector
5. `handhaving-praktisch` — Controle door Belastingdienst: wat gebeurt er, wat zijn je rechten, hoe bereid je je voor

**Fiscaal & Belasting (4 gidsen)**
6. `btw-voor-zzp` — BTW-aangifte: kwartaal vs. maand, kleine ondernemersregeling (KOR), BTW op buitenlandse opdrachten, correcties
7. `inkomstenbelasting-zzp` — IB-aangifte als zzp'er: ondernemersaftrek, zelfstandigenaftrek, MKB-winstvrijstelling, startersaftrek
8. `pensioen-als-zzp` — Pensioenopbouw: OR, lijfrente, banksparen, koopsompolissen — voor- en nadelen concreet doorgerekend
9. `administratie-zzp` — Wat moet je bewaren, hoe lang, welke factuurvereisten, boekhoudprogramma's vergeleken

**Contracten & Bescherming (3 gidsen)**
10. `model-opdrachtovereenkomst` — Welke clausules beschermen jou: geheimhouding, IP, aansprakelijkheidsbeperking, beëindiging, opschortingsrecht
11. `tariefonderhandeling` — Hoe onderhandel je over je uurtarief: marktonderzoek, BATNA, escalatiepad, schriftelijke bevestiging
12. `verzekeringen-zzp` — Welke verzekeringen heb je nodig: AOV, aansprakelijkheid, arbeidsongeschiktheid — vergelijking en rekenregels

**Ondernemen & Groei (3 gidsen)**
13. `kvk-inschrijving-structuur` — BV vs. eenmanszaak: belastingdruk doorgerekend bij verschillende winsten, omzetbelasting, DGA-loon
14. `intermediairen-platforms` — Werken via bureaus en platforms: wat zijn je rechten, hoe zit de kostenstructuur, welke vragen moet je stellen
15. `digitale-administratie` — Cloudtools, e-facturatie, UBL-standaard, automatische BTW-aangifte — praktische workflows

**Implementatieplan gidsen:**
1. Supabase migratie aanmaken (`005_guides_table.sql`)
2. Gids-detail pagina refactoren: lees uit DB i.p.v. hardcoded object
3. Admin gids-editor bouwen: `/admin/gidsen` (WYSIWYG of Markdown)
4. Per gids: diepgaande content schrijven (AI-assisted, door Marvin goedgekeurd)
5. Publicatievlag per gids — alleen live als `is_published = true`

---

### PROD-003: Notificaties als levend systeem

**Probleem:** Tabel bestaat, maar er worden geen notificaties aangemaakt. Pagina is altijd leeg.

**Triggers toevoegen:**
- Na elke analyse: notificatie "Je analyse is klaar" (link naar resultaat)
- Bij nieuwe nieuws met impact 'hoog': notificatie "Nieuw DBA-nieuws met hoge impact"
- Bij abonnementsverlenging: notificatie "Abonnement verlengd tot [datum]"
- Bij betalingsfout: notificatie "Betaling mislukt — actie vereist"
- Bij milestone (bijv. 5e analyse): notificatie "Je hebt nu 5 analyses uitgevoerd"

**Bestanden:** Uitbreiding van Stripe webhook + analyse route om `insert into notifications` te doen

---

## Prioriteit 2 — Kwaliteit & Professionaliteit

### QUAL-001: Analyse-ervaring verdiepen

De kern van het product. Huidige staat: goed maar niet verrassend. Verbeterslagen:

- **Follow-up vragen flow** — Na analyse: toon 2-3 concrete verbetervragen die de gebruiker kan beantwoorden voor een scherper resultaat. Heranalyse toont diff.
- **Vergelijkingsgeschiedenis** — Naast elkaar zien: v1 vs. v2 van dezelfde opdrachtomschrijving (score + aandachtspunten)
- **Sector-context** — Bij IT-opdrachten andere weging dan publiek domein. "Je werkt waarschijnlijk in IT — hier zijn de 3 meest voorkomende valkuilen voor jouw sector."
- **Exportopties uitbreiden** — Nu: PDF. Toevoegen: Word-download (via docx library), kopieer-naar-clipboard voor losse secties

### QUAL-002: Dashboard als command center

Huidige dashboard toont basisstatistieken. Verbeterslagen:

- **Afgelopen analyses snel terug** — Laatste 3 analyses direct zichtbaar met risicoscore
- **Aanbevolen gids** — Op basis van gevonden risicosignalen: "Je hebt 2 keer een gezagsprobleem gehad — lees deze gids"
- **Nieuws-preview** — Top 2 nieuwsberichten met hoge impact direct op dashboard
- **Actiepunten** — "Je hebt een analyse uit 2025 — is de opdracht nog actueel?"

### QUAL-003: Landingspagina scherpstellen

**Quick scan** prominenter — dit is de acquisitie-motor. De scan moet bovenaan staan, niet halverwege.

**Social proof** toevoegen:
- "X analyses uitgevoerd" (dynamisch, uit Supabase)
- Sector-badges: "Gebruikt door IT-professionals en publiek domein"
- Uitkomst-stats: "70% van analyses vindt minstens één hoog-risicosignaal"

**Urgentieboodschap**: handhaving Belastingdienst is actief. Dat moet in de hero, niet verderop.

### QUAL-004: Onboarding flow

Nieuwe gebruikers weten niet wat ze moeten doen. Na eerste login:
- Stap 1: welkomstscherm met uitleg in 3 bullets (30 seconden)
- Stap 2: directe CTA naar analyse met voorbeeldtekst ("probeer het met dit voorbeeld")
- Stap 3: na eerste analyse → referral-widget tonen

---

## Prioriteit 3 — Growth Engine (uit growthplan)

### GROWTH-001: Referral-engine (zie ook GROWTHPLAN_UITVOERING.md)

Volledige technische specificatie staat in `GROWTHPLAN_UITVOERING.md`. Samenvatting:

- Database: `referral_codes`, `referral_rewards`, `referral_tracking`
- API: code ophalen, tracking bij registratie, reward na kwalificerende checkout
- Mijlpalen: 1 referral = gratis check, 3 = 1 maand korting, 5 = 2 maanden korting
- Anti-fraud guards verplicht

**Startmoment:** na STRIPE-LIVE + TEST-006

### GROWTH-002: LinkedIn Insight Tag

- Tag plaatsen op marketing site (landing, pricing, bedankpagina)
- NIET op app-pagina's (gevoelige gebruikersdata)
- Doel: retargeting audiences opbouwen voor week 3+ content

### GROWTH-003: Loops lifecycle uitbreiden

Huidige events: subscription_started, canceled, payment_failed, quick_scan, one_time_purchase.

Toe te voegen:
- `analysis_completed` (met: risico-niveau, score, sector)
- `analysis_count_milestone` (bij 1e, 5e, 10e analyse)
- `referral_milestone_1`, `referral_milestone_3`, `referral_milestone_5`
- `guide_viewed` (optioneel: welke gids)
- `no_activity_7_days` (winback trigger)

### GROWTH-004: Founder coupons klaarstaan

Vóór eerste LinkedIn-post:
- Stripe coupon `FOUNDER20` aanmaken (20 gratis one-time checks)
- Admin-interface om coupon-gebruik bij te houden
- Koppelen aan DM-flow uit growthplan

---

## Prioriteit 4 — Lange termijn / toekomstig

### FUTURE-001: Content management systeem

Zodra gidsen groeien naar 20+: overweeg Contentlayer of een Supabase-backed Markdown editor. Voor nu: admin-pagina met Markdown textarea volstaat.

### FUTURE-002: Team-functionaliteit

Meerdere zzp'ers binnen één opdrachtgever? Team-workspace met gedeelde analyses en gezamenlijk abonnement. Vereist: `organizations` tabel, role-based access per org.

### FUTURE-003: API voor intermediairs

Intermediairs (uitzendbureaus, platforms) kunnen dan bulk-analyses uitvoeren via API-key. Eigen pricing tier.

### FUTURE-004: Modelovereenkomst bibliotheek

Digitale bibliotheek van door Belastingdienst goedgekeurde modelovereenkomsten, gekoppeld aan relevante gidsen.

### FUTURE-005: Pro/Enterprise feature differentiatie

Huidige code heeft rate-limiting per plan maar geen echte feature-gating. Toevoegen:
- Free: 1 analyse/dag, geen gidsen, beperkt nieuws
- Pro (maand/jaar): onbeperkt analysen, alle gidsen, volledig nieuws, PDF-export, notificaties
- Enterprise: API-toegang, team-workspace, dedicated support

---

## Prioriteit 2b — Infrastructuur & Operationeel

### INFRA-001: Control Tower — meegroeien met het product

**Principe:** elke nieuwe feature die in de app wordt gebouwd, krijgt een bijbehorende sectie in de Control Tower. De CT is het operationele dashboard voor de beheerder (Marvin) en moet altijd een compleet beeld geven van de staat van het product.

**Huidige structuur (4 tegels):**
- Gebruikers, Analyses, Sales Funnel, E-mails

**Uitbreiding per nieuwe feature:**

| Feature | CT-uitbreiding |
|---|---|
| PROD-001 Nieuws | Tegel "Nieuws" → `/admin/nieuws` (toevoegen, bewerken, publiceren) |
| PROD-002 Gidsen | Tegel "Gidsen" → `/admin/gidsen` (schrijven, publiceren, volgorde) |
| GROWTH-001 Referral | Tegel "Referral" → `/admin/referral` (top referrers, reward-uitgifte, fraudeverdachten) |
| INFRA-002 Actiepunten | Widget bovenaan CT-root: openstaande actiepunten met directe links |
| GROWTH-004 Coupons | Uitbreiding Gebruikers-pagina: coupon-gebruik per user |

**CT-root herinrichting bij >6 tegels:**
Grid-layout aanpassen naar categorieën:
- **Beheer:** Gebruikers, Nieuws, Gidsen, E-mails
- **Analytics:** Analyses, Sales Funnel, Referral
- **Acties:** Actiepunten-widget bovenaan, altijd zichtbaar

**Bestanden:**
- `app/(app)/admin/page.tsx` — root herinrichten met categoriegroepen + actiepunten-widget
- `app/(app)/admin/nieuws/page.tsx` (nieuw)
- `app/(app)/admin/gidsen/page.tsx` (nieuw)
- `app/(app)/admin/referral/page.tsx` (nieuw, na GROWTH-001)

---

### INFRA-002: Admin actiepunten & e-mailalerts

**Probleem:** Als er iets misgaat (betalingsfout, webhookfout, fraude-signaal, cron-mislukking), heeft Marvin geen zichtbaarheid — tenzij hij actief de CT opent.

**Oplossing: gelaagd alertsysteem**

**Laag 1 — CT actiepunten-widget (altijd zichtbaar bovenaan CT-root):**
```
⚠️ 2 openstaande actiepunten
  › Betaling mislukt: jan.jansen@gmail.com (2 uur geleden) → Bekijk
  › Cron weekly-digest mislukt (gisteren) → Bekijk logs
```

**Laag 2 — Admin e-mailalert (direct bij optreden):**
E-mail naar `marvin.zoetemelk@icloud.com` met:
- Wat er is misgegaan (type, tijdstip, betrokken user/systeem)
- Context (Stripe event ID, user ID, error message)
- Concrete actie: "Klik hier om naar Stripe te gaan" / "Klik hier om user te bekijken in CT"

**Database schema:**
```sql
CREATE TABLE admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,         -- 'payment_failed' | 'webhook_error' | 'cron_failed' | 'fraud_signal' | 'referral_anomaly'
  severity text DEFAULT 'warning', -- 'info' | 'warning' | 'critical'
  title text NOT NULL,
  body text,
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Triggers voor actiepunten:**

| Situatie | Type | Urgentie | E-mail? |
|---|---|---|---|
| Betalingsfout bij gebruiker | `payment_failed` | critical | Ja, direct |
| Stripe webhook 2x mislukt | `webhook_error` | critical | Ja, direct |
| Vermoedelijke referral-fraude | `fraud_signal` | warning | Ja, binnen 1 uur |
| Cron digest niet uitgevoerd | `cron_failed` | warning | Ja, volgende ochtend |
| Nieuwe gebruiker met rol 'admin' (niet Marvin) | `security_alert` | critical | Ja, direct |
| Supabase rate limit bereikt | `infra_warning` | warning | Ja, direct |

**E-mailformat:**
- Via Postmark, zelfde `noreply@dbakompas.nl`
- Onderwerp: `[DBA Kompas Admin] ⚠️ Betalingsfout: jan.jansen@gmail.com`
- Body: plain tekst + twee knoppen: "Bekijk in Control Tower" en directe externe link (Stripe/Supabase)

**Bestanden:**
- `supabase/migrations/006_admin_alerts.sql` (nieuw)
- `lib/admin/alerts.ts` — `createAlert(type, title, body, userId?, metadata?)` + `sendAlertEmail(alert)`
- `app/api/admin/alerts/route.ts` — GET openstaande alerts (voor CT-widget)
- `components/admin/AlertsWidget.tsx` — widget bovenaan CT-root
- Uitbreidingen in: `app/api/billing/webhook/route.ts`, `app/api/cron/*.ts`

---

### INFRA-003: E-maillogo (BIMI + mailbox-branding)

**Probleem:** In de inbox van gebruikers zien e-mails er generiek uit. Geen DBA Kompas-logo zichtbaar naast de afzender.

**Twee niveaus van oplossing:**

**Niveau 1 — Logo in e-mailbody (direct uitvoerbaar):**
Alle Postmark-templates krijgen het DBA Kompas-logo bovenaan de mail. Dit is al (deels) gedaan voor de welkomstmail maar moet consistent zijn voor alle mails: digest, reset-wachtwoord, admin-alerts.

**Niveau 2 — BIMI (Brand Indicators for Message Identification):**
BIMI toont het bedrijfslogo naast de afzendernaam in Gmail, Apple Mail en andere clients die BIMI ondersteunen.

Vereisten voor BIMI:
- DMARC op `dbakompas.nl` instellen op `p=quarantine` of `p=reject` (nu waarschijnlijk alleen SPF/DKIM)
- SVG-logo uploaden (specifiek formaat: Tiny PS profiel)
- BIMI DNS-record toevoegen: `default._bimi.dbakompas.nl TXT "v=BIMI1; l=https://...logo.svg"`
- Optioneel: VMC-certificaat (Verified Mark Certificate) voor Google — kost ~$1.500/jaar, niet nodig voor fase 1

**Stappen:**
1. Check huidige DMARC-configuratie bij Cloudflare/STRATO
2. DMARC-record toevoegen als dat ontbreekt
3. SVG-logo maken in correct formaat (Tiny PS)
4. SVG hosten op `dbakompas.nl/bimi-logo.svg`
5. BIMI DNS-record toevoegen
6. Testen via `https://bimigroup.org/bimi-generator/`

**Bestanden/acties:**
- DNS-aanpassingen bij Cloudflare (DMARC + BIMI TXT-record) — Marvin voert uit
- `public/bimi-logo.svg` — aanmaken in juist formaat
- Postmark templates controleren op consistente logo-positie

---

### INFRA-004: Mobiele navigatie — uitvouwbaar menu

**Probleem:** Op mobiel is de navigatie in de marketing site niet bruikbaar. De "Ga naar de app"-knop is niet zichtbaar op mobile. Desktop mag niet worden aangetast.

**Oplossing:** Hamburger-menu op mobiel met slide-in of dropdown navigatie.

**Specificaties:**
- Hamburger-icoon rechts in header (alleen zichtbaar op `md:hidden`)
- Bij klikken: menu schuift in (overlay of full-width dropdown)
- Menu-items: alle huidige navigatiepunten + "Ga naar de app" CTA-knop
- Sluiten via kruisje of klik buiten het menu
- Smooth animatie (Tailwind `transition`)
- Desktop: volledig ongewijzigd (`hidden md:flex`)

**Bestanden:**
- `app/(marketing)/layout.tsx` of `components/marketing/Header.tsx` — hamburger-logica toevoegen
- Geen wijzigingen aan app-layout (alleen marketing site)

---

## Aanbevolen volgorde van uitvoering

| Fase | Taken | Wanneer |
|---|---|---|
| **Fase 0: Blokkades** | STRIPE-LIVE, TEST-006 | Nu direct |
| **Fase 0b: UX-fixes** | INFRA-004 (mobiel menu), INFRA-003 niveau 1 (logo in mailbody) | Nu direct — kleine impact |
| **Fase 1: Content** | PROD-002 (DB-schema gidsen + eerste 5 gidsen), PROD-001 (nieuws admin + handmatige items) | Direct na Fase 0 |
| **Fase 1b: CT uitbreiding** | INFRA-001 (CT tegels nieuws + gidsen), INFRA-002 (actiepunten-widget + alerts) | Tegelijk met Fase 1 |
| **Fase 2: Ervaring** | QUAL-001 (follow-up vragen), QUAL-004 (onboarding), PROD-003 (notificaties) | Na Fase 1 |
| **Fase 3: Groei** | GROWTH-001 (referral + CT-tegel referral), GROWTH-002 (Insight Tag), GROWTH-003 (Loops events) | Zodra product klaar aanvoelt |
| **Fase 3b: E-mailbranding** | INFRA-003 niveau 2 (BIMI DNS + SVG) | Parallel aan Fase 3 |
| **Fase 4: Markt** | LinkedIn content starten (post 1 t/m 8), DM-outreach, founder coupons | Na Fase 3 |
| **Fase 5: Schalen** | QUAL-002 (dashboard), QUAL-003 (landing), campaign manager week 3 | Als eerste gebruikers binnenkomen |
| **Fase 6: Toekomst** | FUTURE-001 t/m -005 | Op basis van groei en feedback |

---

## Infra-impact vanuit growthplan op de app

Naast de referral-engine vereist het growthplan ook deze app-wijzigingen:

| Growthplan-element | App-wijziging nodig |
|---|---|
| Referral `?ref=CODE` tracking | Cookie-opslag bij landing, koppeling bij registratie (GROWTH-003) |
| LinkedIn Insight Tag | Script in `layout.tsx` van marketing site (ALLEEN marketing) |
| Loops `analysis_completed` event | Uitbreiding `/api/dba/analyse` na opslaan assessment |
| Referral widget na analyse | Nieuw component na analyse-resultaatpagina |
| Make lead-labeling | Webhook op Supabase of directe Make-koppeling na `quick_scan_leads` insert |
| DM-flow founder coupons | Stripe coupon `FOUNDER20` + admin tracking (simpel) |
| LinkedIn Lead Gen Forms | Geen app-wijziging; maakt zelfstandige Loops contact aan via Make |

---

## Kritische succesfactoren

1. **Gidsen zijn het onderscheidende product** naast de analyse. Als een gebruiker na zijn analyse een diepgaande gids vindt die precies zijn sector behandelt, is de kans op upgrade en referral veel groter.

2. **Nieuws moet actueel zijn**. Een nieuwssectie met items van 6 maanden geleden is slechter dan geen nieuws. Liever 5 actuele berichten dan 50 verouderde.

3. **Referral werkt alleen als het product indruk maakt**. Bouw de referral-engine NADAT de kern-ervaring (analyse + gidsen + nieuws) klopt. Een teleurgestelde gebruiker deelt niet.

4. **Lanceer met bewijs, niet met hoop**. Gebruik de 20 founder-coupons om 10-15 echte cases te bouwen. Die cases zijn je content voor de volgende 8 weken LinkedIn.

---

## Documentreferenties

- `docs/GROWTHPLAN_UITVOERING.md` — technisch uitvoeringsplan referral-engine
- `docs/DBA_Kompas_LinkedIn_Referral_Growthplan_April_2026.docx` — volledig growthplan (40 posts, DM-scripts)
- `docs/TASKS.md` — lopende taken per prioriteit
