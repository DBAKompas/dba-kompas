import type { Metadata } from "next";

const SITE = "https://dbakompas.nl";

/**
 * Metadata voor een marketingpagina, inclusief de gegevens voor delen op
 * LinkedIn, WhatsApp en dergelijke. Een pagina die zelf openGraph instelt
 * vervangt die van de root-layout volledig, dus afbeelding en sitenaam staan hier.
 */
export function pageMeta(opts: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  const fullTitle = opts.absoluteTitle ? opts.title : `${opts.title} | DBA Kompas`;
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "website",
      locale: "nl_NL",
      url: `${SITE}${opts.path === "/" ? "" : opts.path}`,
      siteName: "DBA Kompas",
      title: fullTitle,
      description: opts.description,
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "DBA Kompas" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: opts.description,
      images: ["/twitter-image.png"],
    },
  };
}
