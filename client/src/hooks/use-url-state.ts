"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type UrlPatch = Record<string, string | number | null | undefined>;

/**
 * Keeps list state (search, filters, page...) in the URL so it survives refresh,
 * works with the back button and can be shared as a link.
 * Needs a <Suspense> boundary above it (useSearchParams under Cache Components).
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (patch: UrlPatch, options?: { keepPage?: boolean }) => {
      // Read the live URL at call time so a late debounce never overwrites newer changes
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      // Any filter change goes back to page 1 unless told otherwise
      if (!options?.keepPage && !("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const clear = useCallback(
    (keys: string[]) => update(Object.fromEntries(keys.map((k) => [k, null]))),
    [update]
  );

  return { searchParams, update, clear };
}
