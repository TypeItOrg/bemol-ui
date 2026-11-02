import type { ReactElement, ReactNode } from "react";

import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

export const metadata = {
  title: "Mi cuenta",
  other: { "application-title": "Mi cuenta" },
};

export default async function PlatformAccountLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requirePlatformAccount();

  return <>{children}</>;
}
