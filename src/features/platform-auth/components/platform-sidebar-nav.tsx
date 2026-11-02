"use client";

import type { ReactElement } from "react";

import { UserRoundIcon } from "lucide-react";

import { SidebarNavigation } from "@common/components/navigation/sidebar-navigation";
import { useMobileSidebarNavigation } from "@common/hooks/use-mobile-sidebar-navigation";
import type { NavigationItem } from "@common/utils/navigation.util";
import { groupSidebarNavigationSection } from "@common/utils/sidebar-navigation.util";

import { getAcademicSidebarNavigationSections } from "@features/academic/utils/academic-sidebar-navigation.util";

type PlatformSidebarNavProps = {
  sections: readonly { label?: string; items: readonly NavigationItem[] }[];
};

export function PlatformSidebarNav({ sections }: PlatformSidebarNavProps): ReactElement {
  const navigation = useMobileSidebarNavigation();

  const groupedSections = groupSidebarNavigationSection(getAcademicSidebarNavigationSections(sections, "platform"), {
    sectionLabel: "Plataforma",
    id: "platform-account",
    title: "Mi cuenta",
    icon: UserRoundIcon,
    urls: ["/account/profile", "/account/security"],
  });

  return <SidebarNavigation sections={groupedSections} navigation={navigation} />;
}
