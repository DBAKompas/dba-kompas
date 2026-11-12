import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "DBA-check voor zzp'ers: toets je opdracht in een minuut | DBA Kompas",
  absoluteTitle: true,
  description:
    "Toets je zzp-opdracht op aandachtspunten rond de Wet DBA. Binnen een minuut een indicatie per onderdeel, met bronnen en vragen voor het gesprek. Gratis zelfscan, volledige check €9,95.",
  path: "/",
});

export default function Page() {
  return <HomeClient />;
}
