'use client'

import LegalPageLayout from "@/components/marketing/LegalPageLayout";
import { AiDataUseNoticeContent } from "@/components/marketing/LegalContents";

export default function AiDataUseNoticePage() {
  return (
    <LegalPageLayout
      title="AI & Gegevensverwerking"
      subtitle="Hoe DBA Kompas AI inzet en welke gegevens daarbij worden verwerkt."
      lastUpdated="maart 2026"
    >
      <AiDataUseNoticeContent />
    </LegalPageLayout>
  );
}
