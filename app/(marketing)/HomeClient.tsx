'use client'

import { useEffect } from "react";
import { LANDING } from "@/content/landing.nl";
import { useMarketingModals } from "@/lib/store/marketingModals";
import { HomeV3 } from "@/components/marketing/home-v3/HomeV3";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/kennisbank/MarketingChrome";
import { trackLandingPageView, useScrollTracking } from '@/lib/dba-analytics'


const ANSWER_BLOCK_TEXT = LANDING.answerBlock;

const SCHEMA_SOFTWARE_APPLICATION = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DBA Kompas",
  description:
    "Online hulpmiddel voor zzp'ers in Nederland om hun opdrachtomschrijving te toetsen op mogelijke aandachtspunten rond de Wet DBA.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://dbakompas.nl",
  offers: [
    {
      "@type": "Offer",
      name: "Eenmalige check",
      price: "9.95",
      priceCurrency: "EUR",
      description: "Voor één opdracht die nu speelt.",
    },
    {
      "@type": "Offer",
      name: "Maandelijks abonnement",
      price: "20.00",
      priceCurrency: "EUR",
      description: "Voor wie regelmatig nieuwe opdrachten heeft.",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "20.00",
        priceCurrency: "EUR",
        billingDuration: "P1M",
      },
    },
    {
      "@type": "Offer",
      name: "Jaarlijks abonnement",
      price: "200.00",
      priceCurrency: "EUR",
      description: "Voor wie structureel als zelfstandige werkt.",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "200.00",
        priceCurrency: "EUR",
        billingDuration: "P1Y",
      },
    },
  ],
};

const SCHEMA_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DBA Kompas",
  url: "https://dbakompas.nl",
  logo: "https://dbakompas.nl/logo-dark-v3.png",
  email: "info@dbakompas.nl",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "KvK",
    value: "99964538",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@dbakompas.nl",
    contactType: "customer service",
    areaServed: "NL",
    availableLanguage: "Dutch",
  },
};

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function HomeClient() {
  const { openZelfscan, openCheck } = useMarketingModals();

  useEffect(() => {
    trackLandingPageView()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useScrollTracking('landing')
  }, [])

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Wat is DBA Kompas?",
        acceptedAnswer: { "@type": "Answer", text: ANSWER_BLOCK_TEXT },
      },
      ...LANDING.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ],
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_SOFTWARE_APPLICATION) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_ORGANIZATION) }} />

      <MarketingHeader />
      <HomeV3 onZelfscan={openZelfscan} onCheck={(plan) => openCheck(plan)} />
      <MarketingFooter />
    </div>
  );
}
