import type { ReactElement } from "react";

import { redirect } from "next/navigation";

import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";

export default async function EmailPage(): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.userId || user.delegated) {
    return <InstitutionalAccessDenied description="Las credenciales personales solo se gestionan desde la cuenta de su titular." />;
  }

  redirect("/account/profile#account-email");
}
