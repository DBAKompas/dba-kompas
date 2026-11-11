import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: { absolute: "DBA-check voor zzp'ers: toets je opdracht in een minuut | DBA Kompas" },
  description:
    "Toets je zzp-opdracht op aandachtspunten rond de Wet DBA. Binnen een minuut een indicatie per onderdeel en een herschreven opdrachtbrief. Gratis zelfscan, volledige check €9,95.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient />;
}
