import type { ReactElement } from "react";

import { redirect } from "next/navigation";

import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getCredentialManagementMessage } from "@features/institutional-auth/utils/credential-management-message.util";
import { canViewAccountSecurity } from "@features/institutional-auth/utils/institutional-applicant-role.util";

export default async function PasswordPage(): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!canViewAccountSecurity(user)) {
    redirect("/account/profile");
  }

  if (!user.userId || user.delegated) {
    return <InstitutionalAccessDenied description={getCredentialManagementMessage(user)} />;
  }

  redirect("/account/security#account-password");
}
