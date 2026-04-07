'use client'

export type BrandLogoVariant = "dark" | "white" | "flatDark" | "flatWhite" | "artwork" | "flatDarkV2" | "flatDarkV3" | "flatWhiteV3";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  alt?: string;
}

const srcMap: Record<BrandLogoVariant, string> = {
  dark: "/logo-dark.png",
  white: "/logo-white.png",
  flatDark: "/logo-flat-dark.png",
  flatWhite: "/logo-flat-white.png",
  artwork: "/logo-artwork.png",
  flatDarkV2: "/logo-dark-v2.png",
  flatDarkV3: "/logo-dark-v3.png",
  flatWhiteV3: "/logo-white-v3.png",
};

export default function BrandLogo({
  variant = "flatDarkV2",
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
