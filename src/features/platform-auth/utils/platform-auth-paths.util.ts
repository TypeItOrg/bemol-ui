import { getSafeReturnTo } from "@common/utils/return-to.util";

import { toPlatformPublicPath } from "@features/platform-auth/utils/platform-route-paths.util";

export function getSafeNextPath(next: string | null | undefined): string {
  if (typeof next !== "string" || !next) {
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

  const safePath = getSafeReturnTo(next, "/");

  const parsedUrl = new URL(safePath, "https://next.invalid");

  const normalizedPath = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;

  return getSafeReturnTo(toPlatformPublicPath(getSafeReturnTo(normalizedPath, "/")), "/");
}

export function getRedirectPath(to: string, next?: string | null): string {
  if (!next) {
    return to;
  }

  return `${to}?next=${encodeURIComponent(next)}`;
}
