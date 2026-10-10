"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Subscribes to a CSS media query. The server snapshot assumes desktop. */
export function useMediaQuery(query: string, serverValue = true): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
