'use client'

/**
 * LinkedIn Insight Tag (GROWTH-002)
 *
 * Laadt alleen als NEXT_PUBLIC_LINKEDIN_PARTNER_ID is ingesteld.
 * Alleen inzetten in de marketing layout - nooit in de app layout,
 * omdat de tag dan ook op gevoelige app-pagina's zou draaien.
 *
 * Docs: https://www.linkedin.com/help/lms/answer/a418880
 */

import Script from 'next/script'

export function LinkedInInsightTag() {
  const partnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID

  // Tag uitschakelen als de env var ontbreekt (lokale dev of preview zonder instelling).
  if (!partnerId) return null

  return (
    <>
      <Script
        id="linkedin-insight-tag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            _linkedin_partner_id = "${partnerId}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l) {
              if (!l) {
                window.lintrk = function(a,b) { window.lintrk.q.push([a,b]) };
                window.lintrk.q = [];
              }
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";
              b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `,
        }}
      />
      {/* Pixel-fallback voor browsers zonder JavaScript */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt="LinkedIn Insight Tag"
          src={`https://px.ads.linkedin.com/collect/?pid=${partnerId}&fmt=gif`}
        />
      </noscript>
    </>
  )
}
