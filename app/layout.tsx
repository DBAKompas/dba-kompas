import type { Metadata } from "next";
import { Rethink_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { PostHogPageview } from "@/components/analytics/PostHogPageview";

const rethinkSans = Rethink_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  metadataBase: new URL("https://dbakompas.nl"),
  title: {
    default: "DBA Kompas",
    template: "%s | DBA Kompas",
  },
  description:
    "Toets je zzp-opdracht op DBA-risico voordat je het gesprek aangaat",
  applicationName: "DBA Kompas",
  verification: {
    google: "uBWkCLzDPcZScL8QLspMCqUu84Ll-_zPDmofXAce0rQ",
  },
  icons: {
    icon: [
      { url: "/icon.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://dbakompas.nl",
    siteName: "DBA Kompas",
    title: "DBA Kompas",
    description:
      "Toets je zzp-opdracht op DBA-risico voordat je het gesprek aangaat",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "DBA Kompas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DBA Kompas",
    description:
      "Toets je zzp-opdracht op DBA-risico voordat je het gesprek aangaat",
    images: ["/twitter-image.png"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${rethinkSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <PostHogPageview />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
