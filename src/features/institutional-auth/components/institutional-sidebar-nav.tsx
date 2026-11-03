"use client";

import type { ReactElement } from "react";

import { UserRoundIcon } from "lucide-react";

import { SidebarNavigation } from "@common/components/navigation/sidebar-navigation";
import type { MobileSidebarNavigation } from "@common/hooks/use-mobile-sidebar-navigation";
import { groupSidebarNavigationSection } from "@common/utils/sidebar-navigation.util";

import { getAcademicSidebarNavigationSections } from "@features/academic/utils/academic-sidebar-navigation.util";
import type { InstitutionalNavigationSection } from "@features/institutional-auth/utils/institutional-navigation.util";

type InstitutionalSidebarNavProps = {
  sections: readonly InstitutionalNavigationSection[];
  navigation: MobileSidebarNavigation;
};

export function InstitutionalSidebarNav({ sections, navigation }: InstitutionalSidebarNavProps): ReactElement {
  const groupedSections = groupSidebarNavigationSection(getAcademicSidebarNavigationSections(sections, "institutional"), {
    sectionLabel: "Personal",
    id: "institutional-account",
    title: "Mi cuenta",
    icon: UserRoundIcon,
    urls: ["/account/profile", "/account/security"],
    prepend: true,
  });

  return <SidebarNavigation sections={groupedSections} navigation={navigation} />;
}
