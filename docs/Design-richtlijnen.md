# Design-richtlijnen dbakompas.nl

Aanvullend op het werkdocument "Ombouw - DBA-Kompas-projectinstructie". Het werkdocument bepaalt wat er staat en in welke volgorde. Dit document bepaalt hoe het eruitziet en aanvoelt. Beide gelden bij elke stap, tot Marvin een wijziging in deze richtlijnen autoriseert.

Stand: 2026-05-18. Gebaseerd op analyse van collegehouse.com, stripe.com/en-nl en dropbox.com.

---

## 1. Conclusie uit de referenties

De drie sites verschillen sterk van karakter, maar delen acht visuele principes die de huidige dbakompas.nl niet of zwak toepast.

**Stripe:** typografische precisie als kernidentiteit. H1 mengt regular en italic in dezelfde regel om accent te leggen. Statistieken in extreem groot formaat. Bento-grid voor producten. Subtiele wave-gradient als achtergrondelement. Karakter: clean precision.

**Dropbox:** krachtige eenregelige headlines, direct gevolgd door een productscreenshot. Logo-marquee als sociale proof. Iedere kernfunctie krijgt een volledige sectie met linker lifestyle-foto en rechter UI-screenshot. Karakter: bold accessibility.

**College House:** SaaS-pagina dichter bij DBA Kompas qua aard. Hero met twee CTA's. Logo-wall van klanten direct na hero. Statistiek-cards (280+, 3K+, 1.1M+) als bewijs. Tabbed product-showcase met screenshots per persona. Klantenquotes met logo plus naam plus functie. Karakter: data confidence.

---

## 2. Wat dbakompas.nl nu mist

Op basis van de live pagina vergeleken met de referenties:

1. **Geen productvisualisatie.** Behalve de DEMO-sectie staan er geen UI-screenshots. Stripe, Dropbox en College House gebruiken screenshots als belangrijkste visuele asset, niet abstracte iconen.
2. **Geen sociale proof zichtbaar.** Geen logo-wall, geen statistiek-blok met echte cijfers, geen klantenquotes. Het werkdocument verbiedt verzonnen reviews terecht, dus dit moet op een eerlijke manier opgevuld worden (zie sectie 3.6).
3. **Generieke iconografie.** `logo-bullet.png` als opsomming-teken bij elke feature, gevuld met gestapelde voordelen. Drie overlappende voordelen-blokken zeggen hetzelfde.
4. **Tekstdicht zonder visueel ritme.** Lange paragrafen, weinig witruimte, h2's in dezelfde grootte als de body. Geen typografische hiërarchie die het oog stuurt.
5. **Vlak kleurgebruik.** Het accent #d4782a komt vrijwel niet voor in de pagina-styling. Geen gradients, geen achtergrondvariatie tussen secties.
6. **Mismatched bewijs.** "0+ analyses gedaan" werkt averechts. Liever weg dan vals.
7. **Te veel CTA-varianten.** "Probeer nu", "Ga naar de app", "Start je analyse", "Start je gratis zelfscan", "Kies eenmalige check", "Kies maandelijks". De referenties hanteren maximaal twee CTA's, consistent over de hele pagina.

---

## 3. Design-principes (de norm)

### 3.1 Typografie

- **H1 op de hero:** minimaal 56 tot 72 px op desktop, 36 tot 44 px op mobile. Line-height krap (1.05 tot 1.1). Letter-spacing licht negatief op de grote weergave. Maximaal twee regels.
- **H2 sectiekoppen:** 36 tot 48 px op desktop, 28 tot 32 px op mobile. Line-height 1.1 tot 1.2. Stripe-stijl accent: één kernwoord in cursief of in de accentkleur mag, niet meer dan één per H2.
- **Body:** 17 tot 19 px voor primaire copy, line-height 1.55 tot 1.7. Maximaal 65 tekens per regel. Huidige body voelt te klein en te dicht.
- **Eyebrow-labels** boven sectiekoppen: 12 tot 13 px, uppercase, letter-spacing 0.08em, in muted-foreground of accentkleur. Voorbeelden: "Voor wie", "Methodiek", "Prijzen". Geeft sectie-ritme zonder zwaar te worden.
- **Eén lettertype** voor de hele pagina. Geen mix. Inter, Geist of vergelijkbaar moderne sans-serif werkt. Geen serif-experimenten.

### 3.2 Witruimte en sectie-ritme

- **Verticale sectiepadding:** minimaal 96 px op desktop, 64 px op mobile. Huidige `py-16 md:py-20` (64 tot 80 px) is aan de krappe kant voor dit niveau.
- **Afwisseling.** Niet elke sectie hetzelfde. Wissel tussen full-width achtergrondvarianten (donker, licht, met subtiele gradient) en standaardsecties. Twee referenties (Stripe, Dropbox) bouwen visueel ritme op via achtergrondkleurveranderingen.
- **Max-width container:** 1200 tot 1280 px voor inhoud, 1400 tot 1440 px voor full-width hero. Huidige `max-w-7xl` (1280 px) is OK voor inhoud, hero mag breder ademen.
- **Asymmetrische compositie.** Tweekoloms-secties bij voorkeur 60/40 of 55/45, niet 50/50. Geeft hiërarchie.

### 3.3 Kleur

- **Beperkt palet.** Maximaal zes functionele tinten plus zwart en wit.
  - Primary accent: #d4782a (huisstijl)
  - Tekst hoofd: #0b1d3a (dark navy, conform mail-stijl)
  - Tekst muted: een grijstint die 50 tot 60% contrast geeft tegen achtergrond
  - Achtergrond hoofd: #ffffff
  - Achtergrond alternatief: een zeer licht warm tint (#fcf8f4 of vergelijkbaar) voor afwisseling tussen secties
  - Donker accent-sectie: #0b1d3a bg met witte tekst (zoals de mail-stijl)
- **Accent inzetten.** Het oranje moet terugkomen in: hero-CTA, eyebrow-labels, hoogtepunt in H2's, accentlijnen, badge op de prijssectie, en in de productscreenshots. Niet als alarmkleur of als foutmelding.
- **Geen gradients zonder reden.** Eén subtiel gradient-element in de hero (Stripe-stijl wave of soft glow) is acceptabel. Niet op meerdere plekken.

### 3.4 Illustratie en iconografie

- **Vermijd Lucide-iconen** voor de hoofdsecties. Ze geven een generieke SaaS-look. Gebruik ze hooguit klein voor UI-affordances (chevron, copy, externe link).
- **Hoofdvisualisaties:** productscreenshots, abstracte typografische illustraties of bewust grafische elementen (geometrische vormen in huisstijlkleur, lijnen, accenten).
- **Bullet-tekens:** vervang `logo-bullet.png` door een tekst-bullet (`•`), een dunne lijn, of een typografisch accent. De huidige logo-bullets ogen kinderachtig naast een referentie als Stripe.
- **Geen stockfoto's met witte mensen in pakken.** Dropbox-stijl lifestyle-foto's werken alleen met substantieel budget. Beter: clean illustraties of UI-mockups.

### 3.5 Visualisatie van het product

Op dit moment is de productervaring vrijwel onzichtbaar buiten de DEMO-sectie. Dit moet veranderen.

- **Hero-visual:** een productscreenshot van een analyse-uitkomst (geblurde of gedemonstreerde versie, geen echte klantdata) naast of onder de H1.
- **In de "Hoe het werkt"-sectie:** drie kleine UI-screenshots, één per stap, in plaats van enkel tekst.
- **In de methodiek-sectie:** een visualisatie van de drie kernpunten (aansturing en gezag, eigen rekening en risico, ondernemerschap), bv. als een schematisch diagram in huisstijlkleur.

Voorwaarde: alle screenshots moeten productieklaar ogen. Geen lege placeholders, geen lorem ipsum.

### 3.6 Bewijslijnen zonder echte klanten

Het werkdocument verbiedt verzonnen reviews. Tegelijk verwacht de doelgroep bewijssignalen. Mogelijke eerlijke vervangers:

- **Methodiek-onderbouwing als bewijs.** "Beoordeling op basis van de negen Deliveroo-criteria en het kader van de Belastingdienst" als visueel uitgewerkt blok (de drie kernpunten visualisatie uit 3.5).
- **Bronvermelding zichtbaar.** "Gebaseerd op publicaties van de Belastingdienst, Rijksoverheid, en jurisprudentie van de Hoge Raad" met de logo's of namen klein onderaan een relevant blok. Dit is feitelijk en versterkt vertrouwen.
- **Maker zichtbaar.** Foto plus naam plus achtergrond in de methodiek-sectie. Dropbox doet dit niet, College House wel via testimonials. Voor DBA Kompas is de maker de troef.
- **Wel een statistiek-blok, maar zonder usage-cijfers.** Bv. "9 gezichtspunten Deliveroo-arrest", "3 kernpunten in elke analyse", "Methodiek gebaseerd op 2 wettelijke kaders (Wet DBA, jurisprudentie)". Eerlijke cijfers die de zwaarte van het denkwerk laten zien.
- **Update-stempel.** "Methodiek bijgewerkt op [datum] op basis van actuele wetgeving." Maakt het onderhoudsverhaal tastbaar.

### 3.7 Micro-interacties

- **Fade-up bij scroll** is goed en zit er al in. Houden.
- **Subtiele hover-states** op kaarten (lichte schaalvergroting of border-glow). Niet groot.
- **Carrousels** alleen voor lange lijsten (klantenquotes als ze er ooit zijn, of nieuwsupdates). Niet voor hoofdsecties.
- **Geen parallax**, geen video-backgrounds, geen geanimeerde gradients die afleiden van de tekst. De doelgroep is analytisch.

### 3.8 CTA-hiërarchie

- **Twee CTA-teksten totaal op de hele pagina:**
  - Primair: "Start je gratis zelfscan"
  - Secundair (na de prijssectie): "Toets je opdracht voor €9,95"
- **Visueel:** primaire CTA in #d4782a met witte tekst, royale padding (px-6 py-3 minimum), border-radius matig (8 tot 12 px), subtiele hover-state. Secundaire CTA als outline of als tekstlink met underline.
- **Geen CTA's in elke sectie.** De referenties hebben max 3 tot 5 CTA-momenten op de hele homepage, niet bij elke functie.

---

## 4. Sectie-by-sectie aanbevelingen voor de homepage

Volgt de blauwdruk uit sectie 7 van het werkdocument.

| Sectie | Visuele leidraad |
|---|---|
| 1. Hero | Grote H1 (Stripe-grootte), één primaire CTA, één micro-trustregel eronder. Rechts of onder: productscreenshot. Subtiele oranje gradient als achtergrondaccent. |
| 2. Answer block | Eyebrow-label "Wat is DBA Kompas?". Compacte witte sectie met smalle max-width (700 px) voor leesbaarheid. |
| 3. Waarom dit ertoe doet | Sectie met afwijkende achtergrond (lichtwarm tint), grote H2, twee alinea's, geen visuele opsmuk. De inhoud doet het werk. |
| 4. Hoe het werkt | Drie kolommen, elk met klein UI-screenshot plus titel plus eenregelige body. Geen genummerde cirkels in plat kleur. |
| 5. Kan ChatGPT dit niet ook? | Asymmetrische tweekoloms (55/45), DBA Kompas-kant volle aandacht, chatbot-kant gedimd. Werkt al goed in stap 2-uitvoering. |
| 6. Methodiek en mensen | Donkere sectie (#0b1d3a bg, witte tekst, oranje accent). Schematisch diagram van de drie kernpunten links, makerfoto plus naam plus achtergrond rechts. Dit is de identiteit. |
| 7. Wat je krijgt | Geen 3 overlappende voordeel-blokken. Eén visualisatie van de output (rapport, opdrachtbrief, updates) met korte begeleidende tekst. |
| 8. Voor wie | Vier segment-cards in een grid, elk linkend naar de bijbehorende /voor/...-pagina. Subtiel hover-effect. |
| 9. Prijs in verhouding | Donkere of accent-getinte sectie. Grote eenregelige uitspraak. Eén alinea body. |
| 10. Prijzen | Drie kaarten, één met de eerlijke sturende badge. Aantal-limieten weggehaald. |
| 11. Heldere grenzen | Compacte witte sectie, drie subkopjes, korte alinea's. |
| 12. FAQ | Accordion met FAQPage-schema. Strakke typografie, geen plus-min-icoontjes uit een generieke library. |
| 13. Slot-CTA | Donkere of accent-achtergrond. Eén korte uitspraak. Één CTA. |

---

## 5. Wat NIET overnemen uit de referenties

- **Geen logo-wall van klanten** (DBA Kompas heeft die niet en mag geen verzonnen klanten tonen).
- **Geen klantenquotes** tot er echte klanten zijn (sectie 16 van het werkdocument, fase 4).
- **Geen aggregateRating of review-schema** (verbiedt het werkdocument expliciet).
- **Geen Dropbox-style lifestyle-stockfoto's** (te losgezongen van de doelgroep en duur in productie).
- **Geen "happenings"-carrousel zoals Stripe** (geen tijd en geen content om dit te onderhouden).
- **Geen vol-Engelse termen.** Houd de pagina Nederlands. Termen als "answer block" zijn intern.

---

## 6. Toepassingsregels per stap

Per implementatiestap geldt:

1. Claude Code krijgt naast de stap-prompt een verwijzing naar dit document.
2. De prompt benoemt expliciet welke principes uit secties 3.1 tot 3.8 gelden voor die stap.
3. Bij twijfel tussen tokens van het bestaande design system en de richtlijnen hier: deze richtlijnen wegen zwaarder, met als doel de pagina visueel te tillen.
4. Pre-existing UI-componenten worden behouden zolang ze niet conflicteren. Conflicteren ze (bv. de logo-bullets, de drie overlappende voordeel-blokken), dan vervangen.
5. Per stap controleert Marvin op de Vercel preview of de richtlijnen herkenbaar zijn doorgevoerd. Bij twijfel: stap teruggrijpen, niet mergen.

---

## 7. Open beslissingen die later op tafel komen

- **Lettertype keuze.** Inter, Geist of een andere. Vragen aan Marvin voor stap 7 (fase 2 herstructurering).
- **Productscreenshots.** Wie maakt ze, hoe gestyled (echte UI of mock-up), met of zonder schaduw of frame. Beslissen voor stap 7.
- **Makerfoto.** Aanwezigheid en stijl (zakelijk portret, informele werkfoto). Beslissen voor stap 5 (methodiek- en makerblok).
- **Donkere of lichte modus.** De huidige site is licht. Donkere secties als ritme-element zijn aangeraden. Volledige dark mode is geen prioriteit.
