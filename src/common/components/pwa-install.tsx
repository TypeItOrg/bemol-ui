"use client";

import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@common/components/ui/sidebar";
import type { PwaInstallPromptEvent } from "@common/types/pwa-install-prompt-event.types";

const PwaInstallContext = createContext<{ install: () => Promise<void>; isInstalling: boolean } | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }): ReactElement {
  const [deferredPrompt, setDeferredPrompt] = useState<PwaInstallPromptEvent | null>(null);

  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const browserMode = window.matchMedia("(display-mode: browser)");

    function clearPrompt(): void {
      setDeferredPrompt(null);
    }

    function capturePrompt(event: Event): void {
      const promptEvent = event as PwaInstallPromptEvent;

      if (!event.isTrusted || !browserMode.matches || typeof promptEvent.prompt !== "function") {
        return;
      }

      event.preventDefault();
      setDeferredPrompt(promptEvent);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", clearPrompt);
    browserMode.addEventListener("change", clearPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", clearPrompt);
      browserMode.removeEventListener("change", clearPrompt);
    };
  }, []);

  async function install(promptEvent: PwaInstallPromptEvent): Promise<void> {
    if (isInstalling) {
      return;
    }

    setIsInstalling(true);

    try {
      await promptEvent.prompt();
    } catch {
      toast.error("No se pudo abrir la instalación. Intentá de nuevo más tarde.");
    } finally {
      // Each prompt is single-use; keep a newer one if the browser already sent it.
      setDeferredPrompt((current) => (current === promptEvent ? null : current));
      setIsInstalling(false);
    }
  }

  return (
    <PwaInstallContext.Provider value={deferredPrompt ? { install: () => install(deferredPrompt), isInstalling } : null}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function PwaInstallCard(): ReactElement | null {
  const installation = useContext(PwaInstallContext);

  if (!installation) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          size="lg"
          tooltip="Instalar aplicación"
          aria-label="Instalar aplicación"
          aria-busy={installation.isInstalling}
          disabled={installation.isInstalling}
          onClick={() => void installation.install()}
          className="group/install text-primary-foreground hover:text-primary-foreground active:text-primary-foreground relative isolate h-24 flex-col items-start justify-end rounded-xl p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:brightness-110 active:brightness-95 motion-safe:transition-[filter] motion-safe:duration-200"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 100% 0%, color-mix(in oklch, var(--primary) 65%, white), transparent 70%), linear-gradient(135deg, #10080a, var(--primary))",
          }}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 260 128"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            className="pointer-events-none absolute inset-0 size-full! group-data-[collapsible=icon]:hidden"
            preserveAspectRatio="xMaxYMid slice"
          >
            <path d="M288-28C147-9 92 30 146 74c49 39 81 26 120 75" />
            <path d="M293-13C167 8 117 38 166 74c44 33 78 30 109 71" />
            <path d="M300 3C191 22 145 44 188 76c39 29 71 34 97 64" />
          </svg>
          <span
            aria-hidden="true"
            className="absolute top-3 left-3 size-7 bg-[url('/brand/logo-dark.svg')] bg-contain bg-center bg-no-repeat group-data-[collapsible=icon]:static group-data-[collapsible=icon]:size-5"
          />
          <span className="relative flex w-full min-w-0 items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">Instalar aplicación</span>
            <DownloadIcon aria-hidden="true" className="size-4!" />
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
