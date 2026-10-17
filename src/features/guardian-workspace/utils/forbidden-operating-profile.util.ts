/** Discard stale profile state without silently changing the selected identity. */
export function reloadForbiddenOperatingProfile(status: number, requestPath: string): void {
  const personId = requestPath.match(/^\/api\/institutional\/self-service\/([^/]+)/)?.[1];

  if (status === 403 && personId && window.location.pathname.split("/")[2] === personId && window.location.pathname.startsWith("/self-service/")) {
    window.location.reload();
  }
}
