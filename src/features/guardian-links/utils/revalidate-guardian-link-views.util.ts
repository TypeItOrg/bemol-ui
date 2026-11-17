import "server-only";

import { revalidatePath } from "next/cache";

import { GUARDIAN_DEPENDENTS_PAGE_PATH } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { GUARDIAN_LINKS_PAGE_PATH, PLATFORM_GUARDIAN_LINKS_PAGE_PATH } from "@features/guardian-links/constants/guardian-link.constants";

export function revalidateGuardianLinkViews(linkId?: string): void {
  revalidatePath(GUARDIAN_DEPENDENTS_PAGE_PATH);
  revalidatePath(GUARDIAN_LINKS_PAGE_PATH);
  revalidatePath(PLATFORM_GUARDIAN_LINKS_PAGE_PATH);

  if (linkId) {
    revalidatePath(`${GUARDIAN_LINKS_PAGE_PATH}/${linkId}`);
    revalidatePath(`${PLATFORM_GUARDIAN_LINKS_PAGE_PATH}/${linkId}`);
  }
}
