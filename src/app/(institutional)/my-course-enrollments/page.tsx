import { redirect } from "next/navigation";

import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";

export default async function Page() {
  const user = await requireInstitutionalUser();

  redirect(`/self-service/${user.personId}/courses`);
}
