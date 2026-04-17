# Growthplan uitvoering — DBA Kompas

**Bron:** `DBA_Kompas_LinkedIn_Referral_Growthplan_April_2026.docx`
**Aangemaakt:** 2026-04-17
**Doel:** 100 gebruikers in 2 maanden via LinkedIn, referral en lifecycle

---

## Wanneer starten?

Dit plan draait op twee pijlers die technisch gereed moeten zijn:

1. **Stripe live mode** (STRIPE-LIVE) — referral-rewards leunen op echte checkout-events
2. **Loops lifecycle actief** — welkomstmails moeten werken voordat je gebruikers aantrekt

**Startmoment:** zodra STRIPE-LIVE afgerond is én TEST-006 (welkomstmail) gevalideerd is.

---

## Technische bouw — wat er gebouwd moet worden (VOOR lancering)

### GROWTH-001: Referral-engine (database + logica)

**Prioriteit: HOOG — dit is de kern van het growthplan**

Supabase-schema:

```sql
-- Referral codes: één per gebruiker, persistent
CREATE TABLE referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Reward ledger: idempotent, nooit overschrijven
CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referred_id uuid NOT NULL REFERENCES auth.users(id),
  milestone int NOT NULL,          -- 1, 3 of 5
  reward_type text NOT NULL,       -- 'free_check' | 'month_discount'
  stripe_coupon_id text,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id) -- één referrer per referred user
);

-- Referral tracking: van landing tot checkout
CREATE TABLE referral_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid REFERENCES auth.users(id),
  referral_code text NOT NULL,
  referrer_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',   -- pending | qualified | rewarded | fraud
  checkout_session_id text,
  created_at timestamptz DEFAULT now()
);
```

App-logica:
- `GET /api/referral/code` — haalt eigen referral code op (maakt aan als niet bestaat)
- `POST /api/referral/track` — sla `?ref=CODE` op bij registratie (cookie → userId koppeling)
- Webhook `checkout.session.completed` uitbreiden: als `referral_tracking` aanwezig, qualificeer en schrijf reward
- Rewardlogica: na kwalificatie tellen hoeveel geldige referrals referrer heeft → bij 1/3/5 trigger reward
- Anti-fraud: blokkeer zelfverwijzing op `email`, `userId`, `ip`; blokkeer bestaande users die opnieuw afrekenen met code

Stripe-koppeling:
- Maak Stripe-coupon aan voor maandkorting (`REFERRAL_MONTH_DISCOUNT`)
- Pas `ONETIMECREDIT`-logica aan voor `free_check` reward (of aparte coupon)

**Bestanden:**
- `supabase/migrations/004_referral_engine.sql`
- `app/api/referral/code/route.ts`
- `app/api/referral/track/route.ts`
- `app/api/billing/webhook/route.ts` (uitbreiden)

---

### GROWTH-002: Referral widget na analyse

**Prioriteit: HOOG — referral pitch komt direct na ervaren waarde**

Na afronding van een analyse: toon een widget/banner met:
- "Deel DBA Kompas met een collega zzp'er — jij krijgt 1 gratis check"
- Persoonlijke `?ref=CODE` link kopieerbaar
- Voortgangsindicator: 0 / 1 / 3 / 5 referrals (met rewards visueel zichtbaar)

**Bestand:** `components/referral/ReferralWidget.tsx`, ingebouwd in resultaatpagina

---

### GROWTH-003: Referral code tracking via URL

**Prioriteit: HOOG — code moet door de hele funnel heen bewaard blijven**

- Landing (marketing site): sla `?ref=CODE` op in cookie (`dba_ref`, 30 dagen)
- App-registratie: lees cookie bij signup en sla op in `referral_tracking`
- Checkout: voeg `client_reference_id` of metadata toe aan Stripe sessie voor koppeling

---

### GROWTH-004: LinkedIn Insight Tag

**Prioriteit: MIDDEL — nodig voor Campaign Manager retargeting (week 3 van content)**

- Voeg LinkedIn Insight Tag toe aan marketing site (niet in de app zelf)
- Enkel op: landing, pricing, bedanktpagina — NIET op analyse- of profielpagina's (bevat gebruikersinput)
- Bouw website audiences op voor retargeting zodra er organisch verkeer loopt

---

### GROWTH-005: Loops lifecycle journeys voor referral

**Prioriteit: MIDDEL — na GROWTH-001 en -002**

Journeys aanmaken in Loops:
- **Referral reward #1:** "Je hebt een gratis check verdiend" (event: `referral_milestone_1`)
- **Referral reward #3:** "Je maandkorting staat klaar" (event: `referral_milestone_3`)
- **Referral herinnering:** 3 dagen na registratie als 0 referrals (event: `no_referral_reminder`)
- **Upgrade one-time → maand:** getriggerd na 2e analyse of 7 dagen na eerste check

Events toevoegen aan app (bij bestaand Loops-endpoint):
- `referral_milestone_1`, `referral_milestone_3`, `referral_milestone_5`
- `analysis_completed` (als dit er nog niet is)

---

### GROWTH-006: Verwijzing bijhouden in Control Tower

**Prioriteit: LAAG — niet voor lancering nodig**

Uitbreiding `/admin/funnel` of apart tabblad:
- Aantal actieve referral codes
- Top referrers (naam + aantal succesvolle referrals)
- Reward-uitgifte: gratis checks, kortingen
- Referral conversieratio (geklikte links vs. gemaakte accounts vs. betaalde checks)

---

## Niet-technische acties — Marvin voert uit

### LinkedIn content (start na STRIPE-LIVE)

Ritme: 4 posts per week gedurende 8 weken (32 posts gescript in growthplan).

Week 1-2: bewustwording + eerste gesprekken
- Post 1: "De meeste zzp'ers merken DBA-risico pas als het gesprek lastig is"
- Post 2: onduidelijke opdrachten kosten onderhandelingskracht
- Post 3: één zin die IT-zzp'ers vaak te vaag laten
- Post 4: "Ik zoek 20 mensen die DBA Kompas willen testen" (founder coupons)

Week 3-4: bewijs + product
- Voor/na-voorbeelden van opdrachtteksten
- Screenshots van analyseresultaten
- Mini-cases (geanonimiseerd)

Week 5-6: referral lanceren
- Referral-engine live → post over "gratis check via doorverwijzing"
- Gebruikersquotes/cases

Week 7-8: autoriteit + abonnement
- Verdiepende DBA-content
- Upgrade-propositie maand/jaar

**DM-script:** aanwezig in growthplan — handmatig, geen bulk-automation

### LinkedIn Campaign Manager (start week 3, als organisch bewijs er is)

- Budget: €15-€25/dag voor retargeting websitebezoekers
- Inzet: one-time check of founder coupon als CTA
- Pas starten als minimaal 2 organische posts én 1 DM-script aantoonbaar verkeer opleveren

### Founder coupons (week 1-2)

- Maak in Stripe: kortingscode `FOUNDER20` of vergelijkbaar (eerste 20 gratis checks)
- Gebruik in DM-opvolging en post 4

---

## Startcriteria — controleer deze lijst voor go-live

- [ ] STRIPE-LIVE afgerond (live keys, webhook, price IDs)
- [ ] TEST-006 gevalideerd (welkomstmail ontvangen na betaling)
- [ ] GROWTH-001: referral-engine database en routes live
- [ ] GROWTH-002: referral widget zichtbaar na analyse
- [ ] GROWTH-003: `?ref=CODE` tracking door funnel
- [ ] Stripe coupon `REFERRAL_MONTH_DISCOUNT` aangemaakt
- [ ] Loops: referral milestone e-mails aangemaakt
- [ ] LinkedIn profiel bijgewerkt (headline + over-sectie op DBA Kompas gericht)
- [ ] 5 founder coupons klaar voor DM-opvolging

---

## KPI's om bij te houden (wekelijks, via Control Tower)

| Laag | KPI | Streefwaarde |
|---|---|---|
| Bereik | LinkedIn profielbezoeken | Stijgende trend wekelijks |
| Gesprekken | DM-reacties op posts | Min. 5/week in weken 1-2 |
| Activatie | Gebruikte checks (gratis + betaald) | Min. 5 in eerste 14 dagen |
| Revenue | One-time check conversies | Min. 3 in eerste 14 dagen |
| Referral | Gebruikers met min. 1 succesvolle referral | Min. 5% van actieve users |
| Lifecycle | Upgrade one-time → maand | Zichtbaar na week 4 |

---

## Noot over toolstack

Het growthplan noemt Resend en SendGrid — DBA Kompas gebruikt inmiddels **Postmark** voor alle e-mail. Loops blijft de lifecycle-laag. Make is de orkestratielaag. Dit heeft geen invloed op de strategie, enkel op de implementatiedetails van webhooks en events.

---

## Documentreferentie

Volledig growthplan (40 posts, DM-scripts, funnelarchitectuur, tool-rolverdeling):
`docs/DBA_Kompas_LinkedIn_Referral_Growthplan_April_2026.docx`
