import type { SidebarNavigationGroup } from "@common/types/sidebar-navigation-group.types";
import type { SidebarNavigationSection } from "@common/types/sidebar-navigation-section.types";
import type { NavigationItem } from "@common/utils/navigation.util";

export function groupSidebarNavigationSection(
  sections: readonly SidebarNavigationSection[],
  configuration: Omit<SidebarNavigationGroup, "items"> & {
    sectionLabel: string;
    sourceSectionLabel?: string;
    urls: readonly string[];
    prepend?: boolean;
  },
): SidebarNavigationSection[] {
  const { sectionLabel, sourceSectionLabel = sectionLabel, urls, prepend = false, ...group } = configuration;

  const groupedUrls = new Set(urls);

  const sourceSection = sections.find((section) => section.label === sourceSectionLabel);

  const children = sourceSection?.items.filter((item): item is NavigationItem => "url" in item && groupedUrls.has(item.url)) ?? [];

  if (children.length === 0) {
    return [...sections];
  }

  const navigationGroup = { ...group, items: children };

  const groupedSections = sections.map((section) => {
    if (section.label !== sectionLabel && section.label !== sourceSectionLabel) {
      return section;
    }

    const items =
      section.label === sourceSectionLabel ? section.items.filter((item) => !("url" in item && groupedUrls.has(item.url))) : section.items;

    const groupedItems = prepend ? [navigationGroup, ...items] : [...items, navigationGroup];

    return {
      ...section,
      items: section.label === sectionLabel ? groupedItems : items,
    };
  });

  // The destination section may be absent after permission filtering.
  if (!sections.some((section) => section.label === sectionLabel)) {
    const sourceIndex = sections.findIndex((section) => section.label === sourceSectionLabel);

    groupedSections.splice(sourceIndex, 0, { label: sectionLabel, items: [navigationGroup] });
  }

  return groupedSections.filter((section) => section.items.length > 0);
}
