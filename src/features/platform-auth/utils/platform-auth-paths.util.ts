import { getSafeReturnTo } from "@common/utils/return-to.util";

import { toPlatformPublicPath } from "@features/platform-auth/utils/platform-route-paths.util";

export function getSafeNextPath(next: string | null | undefined): string {
  if (!next) {
    return "/";
  }

  if (next.startsWith("http://") || next.startsWith("https://")) {
    try {
      const parsedUrl = new URL(next);

      next = parsedUrl.pathname + parsedUrl.search;
    } catch {
      return "/";
    }
  }

  return getSafeReturnTo(toPlatformPublicPath(getSafeReturnTo(next, "/")), "/");
}

export function getRedirectPath(to: string, next?: string | null): string {
  if (!next) {
    return to;
  }

  return `${to}?next=${encodeURIComponent(next)}`;
}
