"use client";

import { useEffect, type ReactElement } from "react";

import { WifiOffIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { useOnlineStatus } from "@common/hooks/use-online-status";
import { registerPwaServiceWorker, syncPwaThemeColor, syncPwaWindowTitle } from "@common/services/pwa/pwa.service";

export function PwaRuntime(): ReactElement | null {
  const { resolvedTheme } = useTheme();

  const online = useOnlineStatus();

  useEffect(() => {
    syncPwaThemeColor(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(registerPwaServiceWorker, []);

  useEffect(syncPwaWindowTitle, []);

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
