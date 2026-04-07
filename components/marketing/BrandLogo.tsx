'use client'

/**
 * Logo varianten:
 *   dark      — volledig logo (navy tekst + icoon) → lichte achtergronden
 *   white     — volledig logo (witte tekst + icoon) → donkere achtergronden
 *   iconDark  — alleen het kompas-icoon (navy) → lichte achtergronden
 *   iconWhite — alleen het kompas-icoon (wit) → donkere achtergronden
 *
 * Verouderde varianten worden doorgestuurd naar de juiste bestanden.
 */
export type BrandLogoVariant =
  | "dark"
  | "white"
  | "iconDark"
  | "iconWhite"
  | "flatDark"
  | "flatWhite"
  | "flatDarkV2"
  | "flatDarkV3"
  | "flatWhiteV3"
  | "artwork";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  alt?: string;
}

const srcMap: Record<BrandLogoVariant, string> = {
  // Actuele varianten
  dark:      "/logo-dark-v3.png",        // volledig wordmark (kompas + DBAKompas tekst) — lichte achtergrond
  white:     "/logo-white.png",          // volledig logo — donkere achtergrond
  iconDark:  "/logo-flat-dark.png",      // icoon only — lichte achtergrond
  iconWhite: "/logo-flat-white.png",     // icoon only — donkere achtergrond
  // Backwards-compat aliassen
  flatDark:    "/logo-flat-dark.png",
  flatWhite:   "/logo-flat-white.png",
  flatDarkV2:  "/logo-dark-v3.png",
  flatDarkV3:  "/logo-dark-v3.png",
  flatWhiteV3: "/logo-white.png",
  artwork:     "/logo-flat-dark.png",
};

export default function BrandLogo({
  variant = "dark",
  className = "",
  alt = "DBA Kompas",
}: BrandLogoProps) {
  return (
    <img
      src={srcMap[variant]}
      alt={alt}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
