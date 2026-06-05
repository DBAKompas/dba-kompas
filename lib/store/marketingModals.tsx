"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type PlanKey = "monthly" | "yearly" | "one_time_dba";

type Value = {
  zelfscanOpen: boolean;
  emailCheckoutPlan: PlanKey | null;
  openZelfscan: () => void;
  closeZelfscan: () => void;
  openCheck: (plan?: PlanKey) => void;
  closeCheck: () => void;
};

const MarketingModalsCtx = createContext<Value | null>(null);

export function MarketingModalsProvider({ children }: { children: ReactNode }) {
  const [zelfscanOpen, setZelfscan] = useState(false);
  const [emailCheckoutPlan, setEmailCheckoutPlan] = useState<PlanKey | null>(null);

  const openZelfscan = useCallback(() => setZelfscan(true), []);
  const closeZelfscan = useCallback(() => setZelfscan(false), []);
  const openCheck = useCallback((plan: PlanKey = "one_time_dba") => {
    setEmailCheckoutPlan(plan);
  }, []);
  const closeCheck = useCallback(() => setEmailCheckoutPlan(null), []);

  return (
    <MarketingModalsCtx.Provider
      value={{ zelfscanOpen, emailCheckoutPlan, openZelfscan, closeZelfscan, openCheck, closeCheck }}
    >
      {children}
    </MarketingModalsCtx.Provider>
  );
}

export function useMarketingModals(): Value {
  const ctx = useContext(MarketingModalsCtx);
  if (!ctx) {
    throw new Error("useMarketingModals must be used within MarketingModalsProvider");
  }
  return ctx;
}
