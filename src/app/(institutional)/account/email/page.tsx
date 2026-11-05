import type { ReactElement } from "react";

import { redirect } from "next/navigation";

import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";

export default async function EmailPage(): Promise<ReactElement> {
  await requireInstitutionalUser();

  redirect("/account/profile#account-email");
}
