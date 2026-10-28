"use client";

import { useState, type ReactElement } from "react";

import Link from "next/link";

import { ChevronsUpDownIcon, LogOutIcon, MoonIcon, SunIcon, UserRoundIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@common/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@common/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@common/components/ui/sidebar";

import { useGuardianWorkspace } from "@features/guardian-workspace/components/guardian-workspace-provider";
import { GuardianWorkspaceMenuItems } from "@features/guardian-workspace/components/guardian-workspace-selector";
import { PersonInitialsAvatar } from "@features/guardian-workspace/components/person-initials-avatar";
import { InstitutionalLogoutDialog } from "@features/institutional-auth/components/institutional-logout-dialog";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import { canManageDependents } from "@features/institutional-auth/utils/institutional-applicant-role.util";

export function InstitutionalProfileMenu({ user, onNavigate }: { user: InstitutionalUser; onNavigate: (url: string) => void }): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  const { isMobile } = useSidebar();

  const { activeProfile } = useGuardianWorkspace();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const name = activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Perfil no disponible";

  const profileLabel = activeProfile?.self ? `Mi perfil: ${name}` : `Identidad activa: ${name}`;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            tooltip={profileLabel}
            aria-label={profileLabel}
            className="hover:text-sidebar-foreground h-auto min-h-12 px-0 py-2 group-data-[collapsible=icon]:p-0! hover:bg-transparent"
          >
            <SelectedProfileIdentity />
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto shrink-0 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "top" : "right"}
          align={isMobile ? "start" : "end"}
          sideOffset={8}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            const target = event.target as HTMLElement;

            if (target.closest('[aria-haspopup="menu"]')) {
              event.preventDefault();
            }
          }}
          className="w-72 max-w-[calc(100vw-2rem)] min-w-0"
        >
          {canManageDependents(user) && (
            <>
              <GuardianWorkspaceMenuItems onNavigate={onNavigate} />
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>Perfil activo</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="px-2.5 py-1.5">
              <Link href="/account" onClick={() => onNavigate("/account")}>
                <UserRoundIcon />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="px-2.5 py-1.5"
              onSelect={(event) => {
                event.preventDefault();
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
            >
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
              Cambiar tema
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="px-2.5 py-1.5" variant="destructive" onSelect={() => setIsLogoutDialogOpen(true)}>
            <LogOutIcon />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isLogoutDialogOpen ? <InstitutionalLogoutDialog onClose={() => setIsLogoutDialogOpen(false)} /> : null}
    </>
  );
}

function SelectedProfileIdentity(): ReactElement {
  const { activeProfile } = useGuardianWorkspace();

  const name = activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : "Perfil no disponible";

  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <PersonInitialsAvatar
        firstName={activeProfile?.firstName ?? "?"}
        lastName={activeProfile?.lastName ?? ""}
        className="size-[34px] group-data-[collapsible=icon]:size-8!"
      />
      <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
        <span className="block truncate text-sm font-semibold" title={name}>
          {name}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground truncate text-xs" title={activeProfile?.documentNumber}>
            {activeProfile?.documentNumber ?? "DNI no disponible"}
          </span>
          {activeProfile && !activeProfile.self ? <Badge variant="secondary">Activa</Badge> : null}
        </span>
      </span>
    </span>
  );
}
