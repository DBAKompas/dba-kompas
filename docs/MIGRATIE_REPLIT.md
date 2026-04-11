# Van Replit naar productie-infrastructuur
**Wat is het plan en waarom deze stap?**
**Bijgewerkt:** 2026-04-10

---

## Waar ik vandaan kom: Replit

DBA Kompas begon als een prototype op Replit. Handig om snel iets werkends neer te zetten: je schrijft code, je klikt op Run, en het draait. Geen installatie, geen gedoe. Ideaal om een idee te testen.

Maar op een gegeven moment stelde ik mezelf de vraag: hoe zet ik dit serieus live? En toen werd duidelijk dat Replit dat plafond gewoon niet haalt. Geen betrouwbare uptime (de app "slaapt" bij inactiviteit), geen eigen domein zonder omwegen, geen e-mailaflevering via eigen domein, geen productionele billing-integratie, geen monitoring. En de code groeit er snel chaotisch, want er is niets dat je dwingt om gestructureerd te werken.

Replit was goed genoeg om het concept te bewijzen. Voor de rest niet.

---

## Wat het plan is

Geen kleine opknapbeurt, maar een bewuste herbouw op een volwassen stack. En niet zomaar herbouwen, maar op basis van een architectuurraamwerk dat ik ook voor volgende producten kan hergebruiken. Ik wil niet bij elk nieuw project opnieuw dezelfde keuzes doorlopen.

Het plan bestaat uit drie lagen:

**1. Infrastructuur:** de basis
**2. SaaS-kern:** auth, billing, e-mail, analytics
**3. Marketing automation:** e-mailsequenties na de Quick Scan

### Infrastructuur

Next.js als frontend en backend (TypeScript), gehost op Vercel in Frankfurt zodat de data in de EU blijft. DNS via Cloudflare, dat was nodig omdat STRATO geen subdomain MX-records ondersteunt en ik dat nodig had voor de e-mailinfrastructuur. Database en authenticatie via Supabase (PostgreSQL met Row Level Security). Styling via Tailwind + shadcn/ui voor een consistente, professionele uitstraling.

### SaaS-kern

Stripe voor billing: abonnementen, one-time payments, coupons, customer portal. Resend voor alle transactionele e-mails (verificatie, upsell, digests) via `noreply@dbakompas.nl`. PostHog voor product analytics. Sentry voor foutmonitoring.

De architectuur volgt een strikte scheiding: UI doet alleen presentatie, de echte logica zit in de modules, integraties lopen via wrappers in `lib/`. Stripe is de billing-engine, maar toegang tot de app wordt bepaald door de eigen database-state, gesynchroniseerd via webhooks. Dat is belangrijk: als een webhook faalt, wil je niet dat een gebruiker onterecht wel of geen toegang krijgt.

### Marketing automation

Loops voor de e-mailsequenties na de Quick Scan. Elke bezoeker krijgt drie e-mails, afgestemd op zijn risiconiveau (hoog / gemiddeld / laag). De journey stopt automatisch zodra iemand converteert. De negen e-mails (v2) zijn volledig herschreven: eerlijk over wat de scan wel en niet is, met urgentie voor verder onderzoek, en het maandabonnement gepositioneerd als een manier om bij te blijven op DBA-wetgeving.

---

## Waarom niet gewoon op Replit doorgaan?

Het was ook een bewuste keuze over wat DBA Kompas moet zijn. Een tool die ZZP'ers helpt bij juridisch gevoelige beslissingen over schijnzelfstandigheid moet geloofwaardig zijn. Dat begint bij de basis: een eigen domein, uptime die je kunt vertrouwen, e-mail die aankomt, een betaalstroom die klopt.

En dan is er nog het bredere doel: deze hele opzet (de architectuurdocumenten, de mappenstructuur, de keuzes) is zo ingericht dat ik het voor elk volgend SaaS-product kan hergebruiken. Dat is de bouwstraat. DBA Kompas is het eerste product dat erop gebouwd wordt.

---

## Waar ik nu sta (april 2026)

De app is technisch klaar en draait al op Vercel (`dba-kompas.vercel.app`). De enige blokkade voor livegang op `dbakompas.nl` is de DNS-migratie.

Zodra INFRA-001 klaar is, volgen de rest automatisch:

1. **INFRA-001:** DNSSEC bij STRATO deactiveren → NS-records naar Cloudflare wisselen → Resend domein verifiëren → Supabase SMTP instellen → e-mailbevestiging aanzetten
2. **Loops:** Journey A + C activeren, CTA-URLs van Vercel naar `dbakompas.nl` omzetten, oude journeys opruimen
3. **Stripe live:** webhook instellen op `dbakompas.nl`, coupon aanmaken in live mode, keys wisselen in Vercel
4. **TEST-005:** invoerlimiet handmatig testen (3000+ tekens)

De app is klaar. De infrastructuur is er bijna.
