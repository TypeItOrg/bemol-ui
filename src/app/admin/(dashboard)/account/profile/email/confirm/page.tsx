import type { ReactElement } from "react";

import type { Metadata } from "next";

import { PlatformAccountProfile } from "@features/platform-auth/components/platform-account-profile";
import { PlatformEmailConfirmationDialog } from "@features/platform-auth/components/platform-email-confirmation-dialog";
import { requirePlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

export const metadata: Metadata = {
  title: "Confirmar correo",
  other: { "application-title": "Confirmar correo" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PlatformEmailConfirmationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }): Promise<ReactElement> {
  const { token } = await searchParams;

  const account = await requirePlatformAccount();

  return (
    <>
      <PlatformAccountProfile account={account} />
      <PlatformEmailConfirmationDialog key={token} token={typeof token === "string" ? token : ""} />
    </>
  );
}
