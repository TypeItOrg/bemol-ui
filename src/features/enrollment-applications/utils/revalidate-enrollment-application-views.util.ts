import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateEnrollmentApplicationLists(personId?: string): void {
  revalidatePath("/enrollment-applications");
  revalidatePath("/admin/enrollment-applications");

  if (personId) {
    revalidatePath(`/self-service/${personId}/enrollment-applications`);
  } else {
    revalidatePath("/(institutional)/self-service/[personId]/enrollment-applications", "page");
  }
}

export function revalidateEnrollmentApplicationViews(
  applicationId: string,
  { institutionId, personId }: { institutionId?: string; personId?: string } = {},
): void {
  revalidateEnrollmentApplicationLists(personId);
  revalidatePath(`/enrollment-applications/${applicationId}`);

  if (institutionId) {
    revalidatePath(`/admin/enrollment-applications/${institutionId}/${applicationId}`);
  } else {
    revalidatePath("/admin/(dashboard)/enrollment-applications/[institutionId]/[applicationId]", "page");
  }

  if (personId) {
    revalidatePath(`/self-service/${personId}/enrollment-applications/${applicationId}`);
  } else {
    revalidatePath("/(institutional)/self-service/[personId]/enrollment-applications/[applicationId]", "page");
  }
}
