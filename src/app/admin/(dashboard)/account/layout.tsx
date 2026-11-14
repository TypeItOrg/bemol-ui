import type { ReactElement, ReactNode } from "react";

import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

export default async function PlatformAccountLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requirePlatformAccount();

  return <>{children}</>;
}
