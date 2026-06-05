"use client";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMarketingModals } from "@/lib/store/marketingModals";

export function OpenModalFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openZelfscan, openCheck } = useMarketingModals();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const action = searchParams.get("action");
    if (!action) return;

    if (action === "zelfscan") {
      openZelfscan();
      router.replace(pathname, { scroll: false });
    } else if (action === "check") {
      openCheck("one_time_dba");
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
