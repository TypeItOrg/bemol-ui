"use client";

import type { ReactElement } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { tabsListVariants, tabsTriggerStyles } from "@common/components/ui/tabs";
import { cn } from "@common/utils/cn.util";

const ACCOUNT_TABS = [
  { title: "Perfil", url: "/account" },
  { title: "Contraseña", url: "/account/password" },
  { title: "Llaves de acceso", url: "/account/passkeys" },
  { title: "Sesiones", url: "/account/sessions" },
] as const;

export function InstitutionalAccountTabs(): ReactElement {
  const pathname = usePathname();

  const activeUrl = getActiveTabUrl(pathname);

  return (
    <nav aria-label="Secciones de la cuenta" className="w-full max-w-full sm:w-fit">
      <div data-variant="default" className={cn(tabsListVariants(), "grid w-full grid-cols-2 sm:inline-flex sm:w-fit")}>
        {ACCOUNT_TABS.map((tab) => {
          const isActive = tab.url === activeUrl;

          return (
            <Link
              key={tab.url}
              href={tab.url}
              aria-current={isActive ? "page" : undefined}
              data-active={isActive ? true : undefined}
              className={cn(tabsTriggerStyles, "text-center whitespace-normal sm:whitespace-nowrap")}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getActiveTabUrl(pathname: string): string {
  if (pathname.startsWith("/account/password")) {
    return "/account/password";
  }

  if (pathname.startsWith("/account/sessions")) {
    return "/account/sessions";
  }

  if (pathname.startsWith("/account/passkeys")) {
    return "/account/passkeys";
  }

  return "/account";
}
