"use client";

import { useEffect, useState, type ReactElement } from "react";

import Image from "next/image";

import { WifiOffIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { useOnlineStatus } from "@common/hooks/use-online-status";
import { registerPwaServiceWorker, syncPwaThemeColor, syncPwaWindowTitle } from "@common/services/pwa/pwa.service";

export function PwaRuntime(): ReactElement {
  const { resolvedTheme } = useTheme();

  const online = useOnlineStatus();

  const [windowTitle, setWindowTitle] = useState("");

  useEffect(() => {
    syncPwaThemeColor(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(registerPwaServiceWorker, []);

  useEffect(() => syncPwaWindowTitle(setWindowTitle), []);

  return (
    <>
      <div className="pwa-titlebar" title={windowTitle}>
        <Image className="pwa-titlebar-icon dark:hidden" src="/brand/favicon.svg" alt="" width={16} height={16} />
        <Image className="pwa-titlebar-icon hidden dark:block" src="/brand/favicon-dark.svg" alt="" width={16} height={16} />
        <span className="pwa-titlebar-text">{windowTitle}</span>
      </div>
      {!online && (
        <Alert
          role="status"
          aria-live="polite"
          className="sticky top-(--pwa-titlebar-height) z-50 shrink-0 rounded-none border-x-0 border-t-0 px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
        >
          <WifiOffIcon aria-hidden="true" />
          <AlertTitle>Sin conexión</AlertTitle>
          <AlertDescription>Necesitás conexión para usar Bemol. Revisá tu conexión a internet para continuar.</AlertDescription>
        </Alert>
      )}
    </>
  );
}
