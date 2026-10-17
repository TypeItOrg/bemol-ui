"use client";

import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";

import { BookOpenIcon, CalendarRangeIcon, FilePenLineIcon, HomeIcon, UserRoundCheckIcon } from "lucide-react";

import { MobileBottomNavigation } from "@common/components/navigation/mobile-bottom-navigation";
import { SidebarInset, SidebarProvider } from "@common/components/ui/sidebar";

import type { ContextualSearchShortcutPlatform } from "@features/contextual-search/types/contextual-search-shortcut-platform.types";
import { GuardianWorkspaceProvider, useOperatingPersonId } from "@features/guardian-workspace/components/guardian-workspace-provider";
import type { OperatingProfile } from "@features/guardian-workspace/types/operating-profile.types";
import { InstitutionalSidebar } from "@features/institutional-auth/components/institutional-sidebar";
import { InstitutionalTopbar } from "@features/institutional-auth/components/institutional-topbar";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import {
  INSTITUTIONAL_PRIMARY_NAVIGATION_ITEM,
  getInstitutionalNavigationSections,
  type InstitutionalNavigationSection,
} from "@features/institutional-auth/utils/institutional-navigation.util";

type InstitutionalShellProps = {
  children: ReactNode;
  user: InstitutionalUser;
  institutionName?: string;
  defaultSidebarOpen: boolean;
  shortcutPlatform: ContextualSearchShortcutPlatform;
  profiles?: readonly OperatingProfile[];
};

export function InstitutionalShell({
  children,
  user,
  institutionName,
  defaultSidebarOpen,
  shortcutPlatform,
  profiles = [],
}: InstitutionalShellProps): ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);

  const selectedId = useOperatingPersonId();

  const profile = profiles.find((value) => value.personId === selectedId);

  const represented = Boolean(selectedId && selectedId !== user.personId);

  const root = `/self-service/${selectedId}`;

  const primaryItem = selectedId ? { ...INSTITUTIONAL_PRIMARY_NAVIGATION_ITEM, url: root } : INSTITUTIONAL_PRIMARY_NAVIGATION_ITEM;

  const representedSections: InstitutionalNavigationSection[] = [
    { items: profile ? [primaryItem] : [{ title: "Volver a mi perfil", url: "/", icon: HomeIcon }] },
    ...(profile
      ? [
          {
            label: "Inscripciones",
            items: [
              ...(profile.canEnroll ? [{ title: "Nueva inscripción", url: `${root}/enrollment`, icon: FilePenLineIcon }] : []),
              { title: "Mis inscripciones", url: `${root}/enrollment-applications`, icon: UserRoundCheckIcon },
            ],
          },
          {
            label: "Formación",
            items: [
              { title: "Mis materias", url: `${root}/courses`, icon: BookOpenIcon },
              { title: "Mis horarios", url: `${root}/schedules`, icon: CalendarRangeIcon },
            ],
          },
        ]
      : []),
  ];

  const navigationSections = represented ? representedSections : getInstitutionalNavigationSections(user, primaryItem);

  const navigationItems = navigationSections
    .flatMap((section) => section.items)
    .filter((item) => item.url !== INSTITUTIONAL_PRIMARY_NAVIGATION_ITEM.url && item.url !== primaryItem.url)
    .slice(0, 4);

  function handleSidebarOpenChange(open: boolean): void {
    setSidebarOpen(open);
    document.cookie = `institutional-sidebar-open=${open}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <GuardianWorkspaceProvider profiles={profiles} institutionId={user.institutionId}>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={handleSidebarOpenChange}
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-mobile": "18rem",
            "--sidebar-width-icon": "4.5rem",
          } as CSSProperties
        }
      >
        <InstitutionalSidebar user={user} navigationSections={navigationSections} />
        <SidebarInset className="bg-background gap-3 pb-[calc((var(--spacing)*21)+env(safe-area-inset-bottom))] md:m-0 md:ml-0 md:gap-4 md:rounded-none md:p-4 md:shadow-none md:peer-data-[state=collapsed]:ml-0">
          <InstitutionalTopbar
            represented={represented}
            accessSections={navigationSections}
            institutionId={user.institutionId}
            institutionName={institutionName}
            shortcutPlatform={shortcutPlatform}
          />
          <div className="bg-muted flex min-w-0 flex-1 flex-col overflow-x-hidden rounded-none md:rounded-2xl">{children}</div>
        </SidebarInset>
        <MobileBottomNavigation items={navigationItems} primaryItem={primaryItem} />
      </SidebarProvider>
    </GuardianWorkspaceProvider>
  );
}
