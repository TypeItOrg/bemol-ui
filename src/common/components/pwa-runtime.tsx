"use client";

import { useEffect, type ReactElement } from "react";

import { usePathname } from "next/navigation";

import { WifiOffIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { useOnlineStatus } from "@common/hooks/use-online-status";
import { registerPwaServiceWorker, syncPwaThemeColor } from "@common/services/pwa/pwa.service";

export function PwaRuntime(): ReactElement | null {
  const pathname = usePathname();

  const { resolvedTheme } = useTheme();

  const online = useOnlineStatus();

  useEffect(() => {
    syncPwaThemeColor(resolvedTheme);
  }, [pathname, resolvedTheme]);

  useEffect(registerPwaServiceWorker, []);

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
