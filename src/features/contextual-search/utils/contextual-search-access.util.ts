import { getAcademicSidebarNavigationSections } from "@features/academic/utils/academic-sidebar-navigation.util";
import type { ContextualSearchAccessSection } from "@features/contextual-search/types/contextual-search-access-section.types";
import type { ContextualSearchScope } from "@features/contextual-search/types/contextual-search-scope.types";

export function getContextualSearchAccessSections(
  sections: readonly ContextualSearchAccessSection[],
  scope: ContextualSearchScope,
): ContextualSearchAccessSection[] {
  if (scope === "self-service") {
    return [...sections];
  }

  return getAcademicSidebarNavigationSections(sections, scope).flatMap((section) => {
    const accessSections: ContextualSearchAccessSection[] = [];

    for (const item of section.items) {
      if ("items" in item) {
        accessSections.push({ label: `${section.label} / ${item.title}`, items: item.items });
      } else {
        const previousSection = accessSections.at(-1);

        if (previousSection && previousSection.label === section.label) {
          previousSection.items = [...previousSection.items, item];
        } else {
          accessSections.push({ label: section.label, items: [item] });
        }
      }
    }

    return accessSections;
  });
}

export function filterContextualSearchAccessSections(
  sections: readonly ContextualSearchAccessSection[],
  search: string,
): ContextualSearchAccessSection[] {
  const normalizedSearch = normalizeContextualSearchValue(search);

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => normalizeContextualSearchValue(item.title).includes(normalizedSearch)),
    }))
    .filter((section) => section.items.length > 0);
}

export function omitContextualSearchAccessItems(
  sections: readonly ContextualSearchAccessSection[],
  excludedUrls: readonly string[],
): ContextualSearchAccessSection[] {
  const excludedUrlSet = new Set(excludedUrls);

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !excludedUrlSet.has(item.url)),
    }))
    .filter((section) => section.items.length > 0);
}

function normalizeContextualSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
