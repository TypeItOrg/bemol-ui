"use client";

import type { ReactElement } from "react";

import { usePathname } from "next/navigation";

import { ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";

const ACCOUNT_PAGE_TITLES: Readonly<Record<string, string>> = {
  "/account/profile": "Perfil",
  "/account/profile/edit": "Editar perfil",
  "/account/security": "Seguridad",
  "/account/email": "Correo electrónico",
  "/account/password": "Contraseña",
  "/account/passkeys": "Llaves de acceso",
  "/account/sessions": "Sesiones",
};

export function InstitutionalAccountTitle(): ReactElement {
  const pathname = usePathname();

  return <>{ACCOUNT_PAGE_TITLES[pathname] ?? "Perfil"}</>;
}

export function InstitutionalAccountIcon(): ReactElement {
  const pathname = usePathname();

  return <PlatformPageIcon icon={pathname.startsWith("/account/security") ? ShieldCheckIcon : UserRoundIcon} />;
}
