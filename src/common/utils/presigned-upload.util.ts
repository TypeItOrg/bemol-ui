import { z } from "zod";

import type { PresignedUpload } from "@common/types/presigned-upload.types";

export const httpUrlSchema = z.url({ protocol: /^https?$/ });

export const presignedUploadSchema = z.object({
  uploadUrl: httpUrlSchema,
  headers: z.record(z.string(), z.string()),
});

export function createUploadFileSchema(contentTypes: readonly string[], maxBytes: number) {
  return z.object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.string().refine((value) => contentTypes.includes(value)),
    fileSize: z.number().int().positive().max(maxBytes),
  });
}

export async function putPresignedFile(upload: PresignedUpload, file: File): Promise<boolean> {
  try {
    const response = await fetch(upload.uploadUrl, { method: "PUT", headers: upload.headers, body: file });

    return response.ok;
  } catch {
    return false;
  }
}
