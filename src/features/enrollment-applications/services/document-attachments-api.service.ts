import "server-only";

import { revalidatePath } from "next/cache";

import { academicApiFetch } from "@features/academic/services/academic-api-fetch.service";
import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { getSelfServiceEnrollmentApiPath } from "@features/guardian-workspace/services/operating-profile.service";

export async function getDocumentAttachmentsPath(applicationId: string, personId?: string): Promise<string> {
  return personId
    ? `${await getSelfServiceEnrollmentApiPath(personId)}/${applicationId}/attachments`
    : `/api/v1/enrollment-applications/${applicationId}/attachments`;
}

/** Reloads the self-service profile when the backend revokes the selected person. */
export async function fetchDocumentAttachments(scope: AcademicScope, path: string, init: RequestInit, personId?: string): Promise<Response> {
  const response = await academicApiFetch(scope, path, init);

  if (personId && response.status === 403) {
    revalidatePath(`/self-service/${personId}`, "layout");
  }

  return response;
}
