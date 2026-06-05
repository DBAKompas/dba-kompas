"use client";
import { Suspense, type ReactNode } from "react";
import QuickScanModal from "@/components/marketing/QuickScanModal";
import { EmailCheckoutModal } from "@/components/marketing/EmailCheckoutModal";
import { OpenModalFromQuery } from "@/components/marketing/OpenModalFromQuery";
import { MarketingModalsProvider, useMarketingModals } from "@/lib/store/marketingModals";

function ModalsHost() {
  const { zelfscanOpen, closeZelfscan, emailCheckoutPlan, closeCheck } = useMarketingModals();
  return (
    <>
      <QuickScanModal
        open={zelfscanOpen}
        onOpenChange={(open) => {
          if (!open) closeZelfscan();
        }}
      />
      {emailCheckoutPlan && (
        <EmailCheckoutModal preselectedPlan={emailCheckoutPlan} onClose={closeCheck} />
      )}
    </>
  );
}

export function MarketingModalsRoot({ children }: { children: ReactNode }) {
  return (
    <MarketingModalsProvider>
      <Suspense fallback={null}>
        <OpenModalFromQuery />
      </Suspense>
      {children}
      <ModalsHost />
    </MarketingModalsProvider>
  );
}
