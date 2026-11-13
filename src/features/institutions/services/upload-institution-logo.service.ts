import { putPresignedFile } from "@common/utils/presigned-upload.util";

import { presignInstitutionLogoUploadAction } from "@features/institutions/actions/presign-institution-logo.action";
import { INSTITUTION_ERROR_MESSAGES } from "@features/institutions/constants/error-messages.constants";
import type { InstitutionLogoScope, UploadedInstitutionLogo } from "@features/institutions/types/institution-logo-change.types";
import { appendUploadedInstitutionLogo } from "@features/institutions/utils/institution-logo-form.util";

export type InstitutionLogoUploadResult = { logo: UploadedInstitutionLogo; error?: undefined } | { logo?: undefined; error: string };

export async function uploadInstitutionLogoFile(
  institutionId: string,
  scope: InstitutionLogoScope,
  file: File,
): Promise<InstitutionLogoUploadResult> {
  const fallback = INSTITUTION_ERROR_MESSAGES.LOGO_UPDATE;

  try {
    const presigned = await presignInstitutionLogoUploadAction(institutionId, scope, file.type, file.size);

    if (!presigned.upload) {
      return { error: presigned.error };
    }

    if (!(await putPresignedFile(presigned.upload, file))) {
      return { error: fallback };
    }

    return { logo: { version: presigned.upload.version, contentType: file.type, fileSize: file.size } };
  } catch {
    return { error: fallback };
  }
}

export async function uploadInstitutionLogoFromFormData(
  institutionId: string,
  scope: InstitutionLogoScope,
  formData: FormData,
): Promise<string | undefined> {
  const file = formData.get("logoFile");

  if (!(file instanceof File)) {
    return undefined;
  }

  const result = await uploadInstitutionLogoFile(institutionId, scope, file);

  if (!result.logo) {
    return result.error;
  }

  appendUploadedInstitutionLogo(formData, result.logo);

  return undefined;
}
