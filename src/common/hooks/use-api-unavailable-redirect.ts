"use client";

import { useEffect } from "react";

export function useApiUnavailableRedirect(): void {
  useEffect(() => {
    const controller = new AbortController();

    const checkReadiness = async (): Promise<void> => {
      const response = await fetch("/api/health", {
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5_000)]),
      });

      if (response.status !== 503) {
        return;
      }

      const payload: unknown = await response.json();

      if (!controller.signal.aborted && typeof payload === "object" && payload !== null && "status" in payload && payload.status === "unavailable") {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        window.location.replace(`/maintenance.html?returnTo=${encodeURIComponent(returnTo)}`);
      }
    };

    void checkReadiness().catch(() => undefined);

    return () => controller.abort();
  }, []);
}
