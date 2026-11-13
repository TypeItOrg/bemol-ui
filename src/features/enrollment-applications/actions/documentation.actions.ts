"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { academicApiFetch } from "@features/academic/services/academic-api-fetch.service";
import { getAcademicApiBase } from "@features/academic/utils/academic-scope.util";
import { DOCUMENT_MESSAGES } from "@features/enrollment-applications/constants/documentation.constants";
import { parseDocumentRequirementForm } from "@features/enrollment-applications/schemas/document-requirement.schema";
import { fetchDocumentAttachments, getDocumentAttachmentsPath } from "@features/enrollment-applications/services/document-attachments-api.service";
import type { DocumentActionState } from "@features/enrollment-applications/types/document-action-state.types";

const context = z.object({
  scope: z.enum(["admin", "institutional"]),
  applicationId: z.string().uuid(),
});

export async function mutateDocument(
  scope: string,
  applicationId: string,
  operation: string,
  targetId: string,
  _previous: DocumentActionState,
  form: FormData,
  personId?: string,
): Promise<DocumentActionState> {
  const parsed = context
    .extend({ operation: z.enum(["withdraw", "review"]), targetId: z.string().uuid() })
    .safeParse({ scope, applicationId, operation, targetId });

  if (!parsed.success) {
    return { error: DOCUMENT_MESSAGES.invalid };
  }

  const input = parsed.data;

  if (personId !== undefined && !isValidUuid(personId)) {
    return { error: DOCUMENT_MESSAGES.invalid };
  }

  let path = await getDocumentAttachmentsPath(input.applicationId, personId);

  let options: RequestInit;

  if (input.operation === "withdraw") {
    path += `/${input.targetId}`;
    options = { method: "DELETE" };
  } else {
    const review = z
      .object({ status: z.enum(["ACCEPTED", "OBSERVED"]), observation: z.string().max(2000) })
      .safeParse({ status: form.get("status"), observation: form.get("observation") ?? "" });

    if (!review.success) {
      return { error: DOCUMENT_MESSAGES.invalid };
    }

    if (review.data.status === "OBSERVED" && !review.data.observation.trim()) {
      return { error: DOCUMENT_MESSAGES.note };
    }

    path += `/${input.targetId}/review`;
    options = {
      method: "POST",
      body: JSON.stringify(review.data),
      headers: { "Content-Type": "application/json" },
    };
  }

  const error = await getResponseErrorActionState(fetchDocumentAttachments(input.scope, path, options, personId), [], DOCUMENT_MESSAGES.failed);

  if (error) {
    return error;
  }

  revalidatePath("/", "layout");

  return { success: true };
}

export async function saveDocumentRequirement(
  scope: string,
  institutionId: string,
  pathId: string,
  id: string | null,
  _previous: DocumentActionState,
  form: FormData,
): Promise<DocumentActionState> {
  const args = z
    .object({
      scope: z.enum(["admin", "institutional"]),
      institutionId: z.string().uuid(),
      pathId: z.string().uuid(),
      id: z.string().uuid().nullable(),
    })
    .safeParse({ scope, institutionId, pathId, id });

  const request = parseDocumentRequirementForm(form);

  if (!args.success || !request.success) {
    return { error: DOCUMENT_MESSAGES.invalid };
  }

  const input = args.data;

  const path = `${getAcademicApiBase(input.scope, input.institutionId)}/training-paths/${input.pathId}/document-requirements${input.id ? `/${input.id}` : ""}`;

  const error = await getResponseErrorActionState(
    academicApiFetch(input.scope, path, {
      method: input.id ? "PUT" : "POST",
      body: JSON.stringify(request.data),
      headers: { "Content-Type": "application/json" },
    }),
    [],
    DOCUMENT_MESSAGES.failed,
  );

  if (error) {
    return error;
  }

  revalidatePath("/", "layout");

  return { success: true };
}
