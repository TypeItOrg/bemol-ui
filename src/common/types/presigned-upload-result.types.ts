import type { PresignedUpload } from "@common/types/presigned-upload.types";

export type PresignedUploadResult<TReference extends Record<string, string>> =
  { upload: PresignedUpload & TReference; error?: undefined } | { upload?: undefined; error: string };
