"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import type { PresignedUploadResult } from "@common/types/presigned-upload-result.types";
import { getResponseErrorActionState } from "@common/utils/action-state.util";
import { createUploadFileSchema, presignedUploadSchema } from "@common/utils/presigned-upload.util";

import { DOCUMENT_CONTENT_TYPES, DOCUMENT_MAX_BYTES, DOCUMENT_MESSAGES } from "@features/enrollment-applications/constants/documentation.constants";
import { fetchDocumentAttachments, getDocumentAttachmentsPath } from "@features/enrollment-applications/services/document-attachments-api.service";
import type { DocumentActionState } from "@features/enrollment-applications/types/document-action-state.types";

const targetSchema = z.object({
  scope: z.enum(["admin", "institutional"]),
  applicationId: z.uuid(),
  requirementId: z.uuid(),
  personId: z.uuid().optional(),
});

const fileSchema = createUploadFileSchema(DOCUMENT_CONTENT_TYPES, DOCUMENT_MAX_BYTES);

const presignedResponseSchema = presignedUploadSchema.extend({ uploadId: z.uuid() });

export async function presignDocumentUpload(
  scope: string,
  applicationId: string,
  requirementId: string,
  metadata: unknown,
  personId?: string,
): Promise<PresignedUploadResult<{ uploadId: string }>> {
  const target = targetSchema.safeParse({ scope, applicationId, requirementId, personId });

  const file = fileSchema.safeParse(metadata);

  if (!target.success || !file.success) {
    return { error: DOCUMENT_MESSAGES.file };
  }

  const response = fetchDocumentAttachments(
    target.data.scope,
    `${await getDocumentAttachmentsPath(target.data.applicationId, target.data.personId)}/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...file.data, requirementId: target.data.requirementId }),
    },
    target.data.personId,
  );

  const error = await getResponseErrorActionState(response, [], DOCUMENT_MESSAGES.failed);

  if (error) {
    return { error: error.error ?? DOCUMENT_MESSAGES.failed };
  }

  try {
    return { upload: presignedResponseSchema.parse(await (await response).json()) };
  } catch {
    return { error: DOCUMENT_MESSAGES.failed };
  }
}

export async function confirmDocumentUpload(
  scope: string,
  applicationId: string,
  requirementId: string,
  upload: unknown,
  personId?: string,
): Promise<DocumentActionState> {
  const target = targetSchema.safeParse({ scope, applicationId, requirementId, personId });

  const file = fileSchema.extend({ uploadId: z.uuid() }).safeParse(upload);

  if (!target.success || !file.success) {
    return { error: DOCUMENT_MESSAGES.file };
  }

  const response = fetchDocumentAttachments(
    target.data.scope,
    await getDocumentAttachmentsPath(target.data.applicationId, target.data.personId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...file.data, requirementId: target.data.requirementId }),
    },
    target.data.personId,
  );

  const error = await getResponseErrorActionState(response, [], DOCUMENT_MESSAGES.failed);

  if (error) {
    return error;
  }

  revalidatePath("/", "layout");

  return { success: true };
}
