'use client'

import LegalPageLayout from "@/components/marketing/LegalPageLayout";
import { AlgemeneVoorwaardenContent } from "@/components/marketing/LegalContents";

export default function AlgemeneVoorwardenPage() {
  return (
    <LegalPageLayout title="Algemene Voorwaarden">
      <AlgemeneVoorwaardenContent />
    </LegalPageLayout>
  );
}
