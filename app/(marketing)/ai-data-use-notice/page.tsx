'use client'

import LegalPageLayout from "@/components/marketing/LegalPageLayout";
import { AiDataUseNoticeContent } from "@/components/marketing/LegalContents";

export default function AiDataUseNoticePage() {
  return (
    <LegalPageLayout title="AI Data Use Notice">
      <AiDataUseNoticeContent />
    </LegalPageLayout>
  );
}
