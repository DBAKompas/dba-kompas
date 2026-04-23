/**
 * lib/testing/test-cases.ts
 *
 * CENTRALE BRON VAN WAARHEID voor de testmodule.
 *
 * Dit bestand wordt door twee kanten gebruikt:
 *   1. De admin testpagina (/admin/tests) leest dit om de UI te renderen.
 *   2. Claude leest dit om te zien welke testcases er zijn en wat de status is.
 *
 * Wanneer een nieuwe feature wordt gebouwd, voegt Claude in dezelfde commit
 * de bijbehorende testcases toe aan dit bestand.
 *
 * Conventies:
 *   - test_id formaat: [CATEGORIE_PREFIX]-[NNN]  (bijv. "auth-001")
 *   - relatedFiles: paden relatief aan de repo-root
 *   - steps: concreet en uitvoerbaar, max 6 stappen
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface TestCase {
  id: string
  title: string
  description: string
  steps: string[]
  expectedResult: string
  relatedFiles?: string[]
  /** Blocker = moet werken vóór eerste verkoop */
  isBlocker?: boolean
}

export interface TestCategory {
  id: string
  title: string
  description: string
  icon: string          // lucide-react icon name (string, voor serialisatie)
  tests: TestCase[]
}

// ── Categorieën ────────────────────────────────────────────────────────────

export const TEST_CATEGORIES: TestCategory[] = [

  // ── 1. Authenticatie ────────────────────────────────────────────────────
  {
    id: 'auth',
    title: 'Authenticatie',
    description: 'Registratie, login, magic link en wachtwoordherstel.',
    icon: 'KeyRound',
    tests: [
      {
        id: 'auth-001',
        title: 'Registratie nieuw account',
        description: 'Maak een nieuw account aan via /register.',
        steps: [
          'Ga naar /register',
          'Vul een geldig e-mailadres en wachtwoord in',
          'Klik op "Account aanmaken"',
          'Controleer inbox op bevestigingsmail',
        ],
        expectedResult: 'Account aangemaakt, bevestigingsmail ontvangen, doorgestuurd naar dashboard.',
        relatedFiles: ['app/register/page.tsx', 'app/auth/callback/route.ts'],
        isBlocker: true,
      },
      {
        id: 'auth-002',
        title: 'Login met e-mail + wachtwoord',
        description: 'Login met een bestaand account.',
        steps: [
          'Ga naar /login',
          'Vul bestaand e-mailadres en wachtwoord in',
          'Klik op "Inloggen"',
        ],
        expectedResult: 'Succesvol ingelogd, doorgestuurd naar /dashboard.',
        relatedFiles: ['app/login/page.tsx'],
        isBlocker: true,
      },
      {
        id: 'auth-003',
        title: 'Magic link login',
        description: 'Login via een e-maillink zonder wachtwoord.',
        steps: [
          'Ga naar /login',
          'Kies "Inloggen via e-mail link"',
          'Vul e-mailadres in en verstuur',
          'Klik op de link in de inbox',
        ],
        expectedResult: 'Ingelogd en doorgestuurd naar /dashboard.',
        relatedFiles: ['app/login/page.tsx', 'app/auth/callback/route.ts'],
      },
      {
        id: 'auth-004',
        title: 'Wachtwoord vergeten + reset',
        description: 'Wachtwoord resetten via /forgot-password.',
        steps: [
          'Ga naar /forgot-password',
          'Vul e-mailadres in en verstuur',
          'Klik op de resetlink in de inbox',
          'Stel een nieuw wachtwoord in',
        ],
        expectedResult: 'Nieuw wachtwoord ingesteld, inloggen lukt met nieuw wachtwoord.',
        relatedFiles: ['app/forgot-password/page.tsx', 'app/update-password/page.tsx'],
      },
      {
        id: 'auth-005',
        title: 'Uitloggen',
        description: 'Uitloggen vanuit de app.',
        steps: [
          'Log in op de app',
          'Klik op het profiel-icoon of uitlogknop',
          'Bevestig uitloggen',
        ],
        expectedResult: 'Sessie beëindigd, doorgestuurd naar /login.',
        relatedFiles: ['components/auth/AuthContext.tsx'],
      },
    ],
  },

  // ── 2. Checkout & Betaling ───────────────────────────────────────────────
  {
    id: 'checkout',
    title: 'Checkout & Betaling',
    description: 'Stripe checkout voor eenmalig, maand en jaar, inclusief welkomstmail.',
    icon: 'CreditCard',
    tests: [
      {
        id: 'chk-001',
        title: 'Eenmalige aankoop (ingelogd)',
        description: 'Koop een eenmalige DBA-check als ingelogde gebruiker.',
        steps: [
          'Log in en ga naar /upgrade',
          'Kies "Eenmalige check"',
          'Doorloop Stripe checkout met testkaart 4242 4242 4242 4242',
          'Controleer of je terugkomt op de app',
        ],
        expectedResult: 'Betaling geslaagd, one_time_purchase aangemaakt, welkomstmail ontvangen.',
        relatedFiles: ['app/api/checkout/route.ts', 'app/api/billing/webhook/route.ts'],
        isBlocker: true,
      },
      {
        id: 'chk-002',
        title: 'Maandabonnement checkout',
        description: 'Sluit een maandabonnement af.',
        steps: [
          'Log in en ga naar /upgrade',
          'Kies "Maandabonnement"',
          'Doorloop Stripe checkout met testkaart 4242 4242 4242 4242',
        ],
        expectedResult: 'Abonnement actief, subscription aangemaakt in DB, welkomstmail ontvangen.',
        relatedFiles: ['app/api/checkout/route.ts', 'app/api/billing/webhook/route.ts'],
        isBlocker: true,
      },
      {
        id: 'chk-003',
        title: 'Jaarabonnement checkout',
        description: 'Sluit een jaarabonnement af.',
        steps: [
          'Log in en ga naar /upgrade',
          'Kies "Jaarabonnement"',
          'Doorloop Stripe checkout met testkaart 4242 4242 4242 4242',
        ],
        expectedResult: 'Jaarabonnement actief, subscription met plan=yearly in DB.',
        relatedFiles: ['app/api/checkout/route.ts'],
      },
      {
        id: 'chk-004',
        title: 'Guest checkout (zonder account)',
        description: 'Koop een check zonder vooraf in te loggen.',
        steps: [
          'Ga naar dbakompas.nl zonder in te loggen',
          'Klik op de koopknop voor een eenmalige check',
          'Vul een nieuw e-mailadres in bij Stripe',
          'Doorloop betaling',
          'Controleer inbox op welkomstmail + activatielink',
        ],
        expectedResult: 'Account aangemaakt, welkomstmail met werkende activatielink ontvangen.',
        relatedFiles: ['app/api/billing/webhook/route.ts', 'lib/auth/provision-user.ts'],
        isBlocker: true,
      },
      {
        id: 'chk-005',
        title: 'Welkomstmail — activatielink werkt',
        description: 'Klik op de activatielink uit de welkomstmail.',
        steps: [
          'Ontvang welkomstmail na betaling',
          'Klik op de primaire CTA-knop (activatielink)',
          'Stel wachtwoord in',
        ],
        expectedResult: 'Account geactiveerd, ingelogd op dashboard.',
        relatedFiles: ['app/auth/activate/[token]/page.tsx', 'lib/auth/provision-user.ts'],
        isBlocker: true,
      },
    ],
  },

  // ── 3. DBA-analyse ──────────────────────────────────────────────────────
  {
    id: 'analyse',
    title: 'DBA-analyse',
    description: 'Analyseren, quota, PDF-download en notificaties.',
    icon: 'FileSearch',
    tests: [
      {
        id: 'anl-001',
        title: 'Analyse uitvoeren (volledige flow)',
        description: 'Voer een DBA-analyse uit met een opdrachttekst.',
        steps: [
          'Log in met een account met credits',
          'Ga naar het analyseformulier',
          'Plak een opdrachttekst van minimaal 200 tekens',
          'Klik op "Analyseer"',
          'Wacht op resultaat',
        ],
        expectedResult: 'Analyse-resultaat zichtbaar met risicoscore, samenvatting en verbeterpunten.',
        relatedFiles: ['app/api/dba/analyse/route.ts', 'lib/ai/dbaAnalysis.ts'],
        isBlocker: true,
      },
      {
        id: 'anl-002',
        title: 'Quota teller stijgt na analyse',
        description: 'Controleer of de gebruikte quota wordt bijgehouden.',
        steps: [
          'Voer een analyse uit',
          'Bekijk de UsageMeter op het dashboard',
        ],
        expectedResult: 'Teller verhoogd met 1, meter toont correct percentage.',
        relatedFiles: ['modules/usage/check-quota.ts', 'components/usage/UsageMeter.tsx'],
      },
      {
        id: 'anl-003',
        title: 'Quota-limiet geeft 429',
        description: 'Controleer dat de limiet gehandhaafd wordt.',
        steps: [
          'Gebruik een testaccount op de limiet',
          'Probeer nog een analyse uit te voeren',
        ],
        expectedResult: 'HTTP 429 met foutmelding "quota_exceeded".',
        relatedFiles: ['app/api/dba/analyse/route.ts', 'modules/usage/check-quota.ts'],
      },
      {
        id: 'anl-004',
        title: 'PDF-download van analyse',
        description: 'Download het analyserapport als PDF.',
        steps: [
          'Open een afgeronde analyse',
          'Klik op "Download PDF"',
        ],
        expectedResult: 'PDF-bestand gedownload met correcte inhoud en huisstijl.',
        relatedFiles: ['app/api/dba/pdf/route.ts', 'lib/pdf/generate.ts'],
      },
      {
        id: 'anl-005',
        title: 'Notificatie "analyse klaar" verschijnt',
        description: 'Controleer of de in-app notificatie wordt aangemaakt.',
        steps: [
          'Voer een analyse uit',
          'Ga naar /notificaties',
        ],
        expectedResult: 'Notificatie "Uw analyse is klaar" zichtbaar en ongelezen.',
        relatedFiles: ['lib/notifications/index.ts', 'app/api/dba/analyse/route.ts'],
      },
    ],
  },

  // ── 4. Nieuws & RSS ─────────────────────────────────────────────────────
  {
    id: 'nieuws',
    title: 'Nieuws & RSS',
    description: 'Nieuwspagina, RSS refresh en hoog-impact notificaties.',
    icon: 'Newspaper',
    tests: [
      {
        id: 'nws-001',
        title: 'Nieuwspagina laadt berichten',
        description: 'Controleer of nieuwsberichten zichtbaar zijn.',
        steps: [
          'Log in en ga naar /nieuws',
        ],
        expectedResult: 'Minimaal 1 nieuwsbericht zichtbaar, filters werken.',
        relatedFiles: ['app/(app)/nieuws/page.tsx', 'app/api/news/route.ts'],
      },
      {
        id: 'nws-002',
        title: 'Admin: RSS refresh triggeren',
        description: 'Ververs het nieuws handmatig als admin.',
        steps: [
          'Log in als admin',
          'Ga naar /admin/nieuws',
          'Klik op "Nieuws verversen"',
        ],
        expectedResult: 'Nieuwe berichten opgehaald en zichtbaar in overzicht.',
        relatedFiles: ['app/api/news/refresh/route.ts'],
      },
      {
        id: 'nws-003',
        title: 'Gelezen-markering werkt',
        description: 'Markeer een nieuwsbericht als gelezen.',
        steps: [
          'Ga naar /nieuws',
          'Klik een bericht open',
          'Herlaad de pagina',
        ],
        expectedResult: 'Bericht toont niet meer als "nieuw", badge-teller daalt.',
        relatedFiles: ['app/api/news/read/route.ts'],
      },
      {
        id: 'nws-004',
        title: 'Hoog-impact nieuws → notificatie fan-out',
        description: 'Controleer fan-out bij aanmaken hoog-impact bericht.',
        steps: [
          'Log in als admin',
          'Maak een nieuwsbericht aan met impact "hoog"',
          'Log in als normale gebruiker',
          'Ga naar /notificaties',
        ],
        expectedResult: 'Notificatie "Nieuw DBA-nieuws met hoge impact" zichtbaar.',
        relatedFiles: ['app/api/admin/nieuws/route.ts', 'lib/notifications/index.ts'],
      },
    ],
  },

  // ── 5. Gidsen ───────────────────────────────────────────────────────────
  {
    id: 'gidsen',
    title: 'Gidsen',
    description: 'Overzicht en detailpagina\'s van de 10 DBA-gidsen.',
    icon: 'BookOpen',
    tests: [
      {
        id: 'gds-001',
        title: 'Gidsen-overzicht laadt',
        description: 'Controleer of alle gidsen zichtbaar zijn.',
        steps: [
          'Log in en ga naar /gidsen',
        ],
        expectedResult: '10 gidsen zichtbaar, ingedeeld in categorieën met moeilijkheidsgraad.',
        relatedFiles: ['app/(app)/gidsen/page.tsx', 'lib/guides/content.ts'],
      },
      {
        id: 'gds-002',
        title: 'Gids detailpagina opent',
        description: 'Open één gids en controleer de inhoud.',
        steps: [
          'Ga naar /gidsen',
          'Klik op een gids',
        ],
        expectedResult: 'Detailpagina laadt met volledige inhoud, callouts en tabellen correct opgemaakt.',
        relatedFiles: ['app/(app)/gidsen/[slug]/page.tsx'],
      },
    ],
  },

  // ── 6. Notificaties ─────────────────────────────────────────────────────
  {
    id: 'notificaties',
    title: 'Notificaties',
    description: 'In-app notificatiepagina en markering als gelezen.',
    icon: 'Bell',
    tests: [
      {
        id: 'not-001',
        title: 'Notificatiepagina laadt',
        description: 'Controleer of de notificatiepagina werkt.',
        steps: [
          'Log in en ga naar /notificaties',
        ],
        expectedResult: 'Pagina laadt zonder fout. Bij geen notificaties: leeg-state zichtbaar.',
        relatedFiles: ['app/(app)/notificaties/page.tsx', 'app/api/notifications/route.ts'],
      },
      {
        id: 'not-002',
        title: 'Notificatie als gelezen markeren',
        description: 'Markeer een notificatie als gelezen.',
        steps: [
          'Ga naar /notificaties',
          'Klik op "Gelezen" bij een ongelezen notificatie',
        ],
        expectedResult: 'Notificatie krijgt lagere opacity, badge-teller daalt.',
        relatedFiles: ['app/api/notifications/[id]/read/route.ts'],
      },
      {
        id: 'not-003',
        title: 'Notificatie "betaling mislukt"',
        description: 'Controleer de notificatie bij een mislukte betaling.',
        steps: [
          'Simuleer invoice.payment_failed via Stripe CLI: stripe trigger invoice.payment_failed',
          'Ga naar /notificaties van de betrokken gebruiker',
        ],
        expectedResult: 'Notificatie "Betaling mislukt" zichtbaar als type warning.',
        relatedFiles: ['app/api/billing/webhook/route.ts', 'lib/notifications/index.ts'],
      },
    ],
  },

  // ── 7. Admin ────────────────────────────────────────────────────────────
  {
    id: 'admin',
    title: 'Admin & Control Tower',
    description: 'Control Tower, gebruikersoverzicht, alerts en beheer.',
    icon: 'Shield',
    tests: [
      {
        id: 'adm-001',
        title: 'Control Tower laadt',
        description: 'Controleer of het admin-dashboard zichtbaar is.',
        steps: [
          'Log in als admin (marvin.zoetemelk@icloud.com)',
          'Ga naar /admin',
        ],
        expectedResult: 'Admin-dashboard zichtbaar met alle tegels en AlertsWidget.',
        relatedFiles: ['app/(app)/admin/page.tsx'],
      },
      {
        id: 'adm-002',
        title: 'Gebruikersoverzicht + filters',
        description: 'Bekijk en filter gebruikers in het overzicht.',
        steps: [
          'Ga naar /admin/gebruikers',
          'Gebruik de zoekbalk om een gebruiker te zoeken',
          'Test een statusfilter',
        ],
        expectedResult: 'Tabel laadt met alle gebruikers, filters werken correct, tabel scrollt horizontaal.',
        relatedFiles: ['app/(app)/admin/gebruikers/page.tsx', 'components/admin/GebruikerFilters.tsx'],
      },
      {
        id: 'adm-003',
        title: 'Alerts widget toont openstaande alerts',
        description: 'Controleer de AlertsWidget op de Control Tower.',
        steps: [
          'Ga naar /admin',
          'Bekijk de AlertsWidget bovenaan',
        ],
        expectedResult: 'Widget toont openstaande critical/warning alerts, of leeg-state als er geen zijn.',
        relatedFiles: ['components/admin/AlertsWidget.tsx', 'app/api/admin/alerts/route.ts'],
      },
      {
        id: 'adm-004',
        title: 'Admin-alertmail ontvangen',
        description: 'Controleer of alertmails aankomen in iCloud.',
        steps: [
          'Trigger een kritieke alert (bijv. via GitHub Actions workflow_dispatch)',
          'Controleer marvin.zoetemelk@icloud.com',
        ],
        expectedResult: 'Mail ontvangen met rode KRITIEK-header, metadata-tabel en "Open Control Tower"-knop.',
        relatedFiles: ['lib/admin/alerts.ts', '.github/workflows/pending-alerts.yml'],
      },
      {
        id: 'adm-005',
        title: 'Nieuws beheer — aanmaken en bewerken',
        description: 'Maak een nieuwsbericht aan en bewerk het.',
        steps: [
          'Ga naar /admin/nieuws',
          'Maak een nieuw bericht aan',
          'Bewerk het bericht',
          'Verwijder het testbericht',
        ],
        expectedResult: 'CRUD-operaties werken zonder fout.',
        relatedFiles: ['app/(app)/admin/nieuws/page.tsx', 'app/api/admin/nieuws/route.ts'],
      },
    ],
  },

  // ── 8. Referral ─────────────────────────────────────────────────────────
  {
    id: 'referral',
    title: 'Referral',
    description: 'Referral code, widget, tracking en kwalificatie.',
    icon: 'Share2',
    tests: [
      {
        id: 'ref-001',
        title: 'Referral widget zichtbaar na analyse',
        description: 'Controleer of de referral widget verschijnt na een analyse.',
        steps: [
          'Voer een analyse uit als ingelogde betaalde gebruiker',
          'Scroll naar beneden op de resultatenpagina',
        ],
        expectedResult: 'ReferralWidget zichtbaar met persoonlijke referral-link en voortgangsindicator.',
        relatedFiles: ['components/referral/ReferralWidget.tsx'],
      },
      {
        id: 'ref-002',
        title: '?ref=CODE tracking via cookie',
        description: 'Controleer of referral codes worden opgeslagen.',
        steps: [
          'Bezoek dbakompas.nl?ref=TESTCODE',
          'Open DevTools → Application → Cookies',
          'Zoek naar "dba_ref"',
        ],
        expectedResult: 'Cookie "dba_ref" aanwezig met waarde TESTCODE, 30 dagen geldig.',
        relatedFiles: ['middleware.ts'],
      },
      {
        id: 'ref-003',
        title: 'Referral kwalificatie na betaling',
        description: 'Controleer of een referral wordt gekwalificeerd bij betaling.',
        steps: [
          'Kopieer referral-link van gebruiker A',
          'Open link in incognito, registreer als nieuwe gebruiker B',
          'Laat gebruiker B betalen',
          'Controleer /admin/referral voor de kwalificatie',
        ],
        expectedResult: 'Referral_tracking status = "qualified", referrer zichtbaar in admin.',
        relatedFiles: ['lib/referral/engine.ts', 'app/api/billing/webhook/route.ts'],
      },
    ],
  },

  // ── 9. Billing & Abonnement ─────────────────────────────────────────────
  {
    id: 'billing',
    title: 'Billing & Abonnement',
    description: 'Klantportaal, verlenging en abonnementsbeheer.',
    icon: 'Receipt',
    tests: [
      {
        id: 'bil-001',
        title: 'Klantportaal toegankelijk',
        description: 'Controleer of /billing/portal werkt voor abonnees.',
        steps: [
          'Log in als gebruiker met actief abonnement',
          'Ga naar /billing/portal of gebruik de knop in de app',
        ],
        expectedResult: 'Doorgestuurd naar Stripe klantportaal.',
        relatedFiles: ['app/api/billing/portal/route.ts'],
      },
      {
        id: 'bil-002',
        title: 'Notificatie bij abonnementsverlenging',
        description: 'Controleer of de verlengingsnotificatie aankomt.',
        steps: [
          'Simuleer invoice.paid (subscription_cycle) via Stripe CLI',
          'Ga naar /notificaties',
        ],
        expectedResult: 'Notificatie "Abonnement verlengd" zichtbaar als type success.',
        relatedFiles: ['app/api/billing/webhook/route.ts', 'lib/notifications/index.ts'],
      },
    ],
  },

  // ── 10. Infrastructuur ──────────────────────────────────────────────────
  {
    id: 'infra',
    title: 'Infrastructuur',
    description: 'LinkedIn tag, crons, PostHog en Sentry.',
    icon: 'Server',
    tests: [
      {
        id: 'inf-001',
        title: 'LinkedIn Insight Tag actief',
        description: 'Controleer of de LinkedIn tag laadt op de marketing site.',
        steps: [
          'Open dbakompas.nl in Chrome',
          'Open DevTools → Network → filter op "snap.licdn.com"',
        ],
        expectedResult: 'Request naar snap.licdn.com/li.lms-analytics/insight.min.js zichtbaar.',
        relatedFiles: ['components/analytics/LinkedInInsightTag.tsx', 'app/(marketing)/layout.tsx'],
      },
      {
        id: 'inf-002',
        title: 'GitHub Actions cron pending-alerts',
        description: 'Controleer of de externe cron draait.',
        steps: [
          'Ga naar github.com/DBAKompas/dba-kompas → Actions',
          'Zoek workflow "pending-alerts"',
          'Trigger handmatig via workflow_dispatch',
        ],
        expectedResult: 'HTTP 200, response {"processed":N,"mailed":M,"mailFailed":0}.',
        relatedFiles: ['.github/workflows/pending-alerts.yml'],
      },
      {
        id: 'inf-003',
        title: 'PostHog events worden geregistreerd',
        description: 'Controleer of analyse-events in PostHog aankomen.',
        steps: [
          'Voer een analyse uit',
          'Open PostHog → Live Events',
        ],
        expectedResult: 'Event "analysis_completed" zichtbaar met correcte properties.',
        relatedFiles: ['lib/posthog.ts', 'app/api/dba/analyse/route.ts'],
      },
    ],
  },
]

// ── Helper: totaalcijfers ──────────────────────────────────────────────────

export function getTotalCounts() {
  const totalTests = TEST_CATEGORIES.reduce((sum, cat) => sum + cat.tests.length, 0)
  const totalBlockers = TEST_CATEGORIES.reduce(
    (sum, cat) => sum + cat.tests.filter(t => t.isBlocker).length,
    0,
  )
  return { totalTests, totalBlockers, totalCategories: TEST_CATEGORIES.length }
}

// ── Helper: prompt genereren ───────────────────────────────────────────────

export function generateIssuePrompt(
  testCase: TestCase,
  category: TestCategory,
  issueDescription: string,
): string {
  const stepsText = testCase.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const filesText = testCase.relatedFiles?.length
    ? `\n## Mogelijk betrokken bestanden\n\n${testCase.relatedFiles.join('\n')}`
    : ''

  return `Je werkt aan DBA Kompas — een Next.js 16 / React 19 / TypeScript / Supabase / Stripe SaaS-app voor Wet DBA compliance-analyse (live op dbakompas.nl).

Stack: Next.js 16, React 19, TypeScript strict, Supabase (RLS + service_role), Stripe webhooks, Postmark, Loops, PostHog, Vercel Hobby.
Repo: DBAKompas/dba-kompas

## Testcase mislukt

**ID:** ${testCase.id}
**Categorie:** ${category.title}
**Testcase:** ${testCase.title}

## Beschrijving van het probleem

${issueDescription}

## Verwacht gedrag

${testCase.expectedResult}

## Teststappen

${stepsText}
${filesText}

Analyseer het probleem, identificeer de oorzaak en geef een concrete fix inclusief de gewijzigde bestanden.`
}
