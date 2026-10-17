import { redirect } from "next/navigation";

import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";

export default async function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const user = await requireInstitutionalUser();

  const { applicationId } = await params;

  redirect(`/self-service/${user.personId}/enrollment-applications/${applicationId}`);
}
