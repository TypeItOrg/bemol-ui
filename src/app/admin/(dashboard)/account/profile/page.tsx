import type { ReactElement } from "react";

import { PlatformAccountProfile } from "@features/platform-auth/components/platform-account-profile";
import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

export const metadata = { title: "Perfil", other: { "application-title": "Perfil" } };

export default async function PlatformProfilePage(): Promise<ReactElement> {
  const account = await requirePlatformAccount();

  return <PlatformAccountProfile account={account} />;
}
