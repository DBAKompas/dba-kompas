'use client'

import LegalPageLayout from "@/components/marketing/LegalPageLayout";
import { PrivacyEnCookiebeleidContent } from "@/components/marketing/LegalContents";

export default function PrivacyEnCookiebeleidsPage() {
  return (
    <LegalPageLayout
      title="Privacy- en Cookiebeleid"
      subtitle="Hoe DBA Kompas omgaat met persoonsgegevens en cookies."
      lastUpdated="maart 2026"
    >
      <PrivacyEnCookiebeleidContent />
    </LegalPageLayout>
  );
}
