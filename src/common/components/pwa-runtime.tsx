"use client";

import { useEffect, useSyncExternalStore, type ReactElement } from "react";

import { usePathname } from "next/navigation";

import { WifiOffIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";

function subscribeToConnectionChange(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function PwaRuntime(): ReactElement | null {
  const pathname = usePathname();

  const { resolvedTheme } = useTheme();

  const online = useSyncExternalStore(
    subscribeToConnectionChange,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") {
      return;
    }

    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", resolvedTheme === "dark" ? "#10080a" : "#faf9f6");
  }, [pathname, resolvedTheme]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      console.warn("[PWA] No se pudo preparar el aviso sin conexión. La aplicación sigue disponible online.");
    });
  }, []);

  if (online) {
    return null;
  }

  return (
    <Alert
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 shrink-0 rounded-none border-x-0 border-t-0 px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <WifiOffIcon aria-hidden="true" />
      <AlertTitle>Sin conexión</AlertTitle>
      <AlertDescription>Necesitás conexión para usar Bemol. Revisá tu conexión a internet para continuar.</AlertDescription>
    </Alert>
  );
}
