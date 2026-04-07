'use client'

import LegalPageLayout from "@/components/marketing/LegalPageLayout";
import { AlgemeneVoorwaardenContent } from "@/components/marketing/LegalContents";

export default function AlgemeneVoorwardenPage() {
  return (
    <LegalPageLayout
      title="Algemene Voorwaarden"
      subtitle="Van toepassing op alle diensten van DBA Kompas."
      lastUpdated="maart 2026"
    >
      <AlgemeneVoorwaardenContent />
    </LegalPageLayout>
  );
}
