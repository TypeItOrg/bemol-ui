"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

const HIDDEN_REFRESH_THRESHOLD_MS = 30_000;

export function RouteVisibilityRefresh(): null {
  const router = useRouter();

  const queryClient = useQueryClient();

  useEffect(() => {
    let hiddenAt = document.hidden ? performance.now() : undefined;

    function handleVisibilityChange(): void {
      if (document.hidden) {
        hiddenAt = performance.now();

        return;
      }

      const shouldRefresh = hiddenAt !== undefined && performance.now() - hiddenAt >= HIDDEN_REFRESH_THRESHOLD_MS;

      hiddenAt = undefined;

      if (shouldRefresh) {
        router.refresh();
        void queryClient.refetchQueries({ type: "active", predicate: (query) => query.meta?.refreshOnReturn === true }, { cancelRefetch: false });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router, queryClient]);

  return null;
}
