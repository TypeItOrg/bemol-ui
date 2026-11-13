import type { PresignedUpload } from "@common/types/presigned-upload.types";
import type { UploadFileMetadata } from "@common/types/upload-file-metadata.types";
import { putPresignedFile } from "@common/utils/presigned-upload.util";

/** Presigns, uploads straight to storage, then confirms the stored file with the backend. */
export async function uploadWithPresignedUrl<TUpload extends PresignedUpload, TResult extends { error?: string }>(
  file: File,
  presign: (metadata: UploadFileMetadata) => Promise<{ upload?: TUpload; error?: string }>,
  confirm: (upload: TUpload, metadata: UploadFileMetadata) => Promise<TResult>,
  failureMessage: string,
): Promise<TResult | { error: string }> {
  const metadata = { fileName: file.name, contentType: file.type, fileSize: file.size };

  const presigned = await presign(metadata);

  if (!presigned.upload) {
    return { error: presigned.error ?? failureMessage };
  }

  if (!(await putPresignedFile(presigned.upload, file))) {
    return { error: failureMessage };
  }

  return confirm(presigned.upload, metadata);
}
