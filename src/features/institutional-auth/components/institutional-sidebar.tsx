"use client";

import type { ComponentProps, ReactElement } from "react";

import { PwaInstallCard } from "@common/components/pwa-install";
import { Sidebar, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem } from "@common/components/ui/sidebar";
import { useMobileSidebarNavigation } from "@common/hooks/use-mobile-sidebar-navigation";
import { cn } from "@common/utils/cn.util";

import { InstitutionalProfileMenu } from "@features/institutional-auth/components/institutional-profile-menu";
import { InstitutionalSidebarNav } from "@features/institutional-auth/components/institutional-sidebar-nav";
import type { InstitutionalUser } from "@features/institutional-auth/types/institutional-user.types";
import type { InstitutionalNavigationSection } from "@features/institutional-auth/utils/institutional-navigation.util";

type InstitutionalSidebarProps = ComponentProps<typeof Sidebar> & {
  user: InstitutionalUser;
  navigationSections: readonly InstitutionalNavigationSection[];
};

export function InstitutionalSidebar({ user, navigationSections, className, ...props }: InstitutionalSidebarProps): ReactElement {
  const navigation = useMobileSidebarNavigation();

  return (
    <Sidebar collapsible="icon" variant="sidebar" className={cn("bg-muted [&_[data-slot=sidebar-inner]]:bg-muted", className)} {...props}>
      <SidebarContent className="p-4">
        <InstitutionalSidebarNav sections={navigationSections} navigation={navigation} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-4 group-data-[collapsible=icon]:items-center">
        <PwaInstallCard />
        <SidebarMenu>
          <SidebarMenuItem>
            <InstitutionalProfileMenu user={user} onNavigate={navigation.handleNavigation} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
