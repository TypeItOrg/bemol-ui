import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
  ariaLabel?: string;
};

export function isNavigationItemActive(pathname: string, url: string, exact = false): boolean {
  const activePathname = pathname.replace(/^(\/admin)?\/course-enrollments\/([^/]+)\/waitlist\/?$/, "$1/courses/$2/waitlist");

  if (url === "/my-teaching" && (activePathname === "/my-teaching/schedules" || activePathname.startsWith("/my-teaching/schedules/"))) {
    return false;
  }

  return exact ? activePathname === url : activePathname === url || activePathname.startsWith(`${url}/`);
}
