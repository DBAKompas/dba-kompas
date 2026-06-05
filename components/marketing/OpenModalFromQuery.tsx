"use client";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function OpenModalFromQuery({
  openZelfscan,
  openCheck,
}: {
  openZelfscan: () => void;
  openCheck: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const action = searchParams.get("action");
    if (!action) return;

    if (action === "zelfscan") {
      openZelfscan();
      router.replace(pathname, { scroll: false });
    } else if (action === "check") {
      openCheck();
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
