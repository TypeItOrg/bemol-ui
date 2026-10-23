"use client";

import { useEffect, useSyncExternalStore, type ReactElement } from "react";

import { WifiOffIcon } from "lucide-react";

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
  const online = useSyncExternalStore(
    subscribeToConnectionChange,
    () => navigator.onLine,
    () => true,
  );

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
