import { INSTITUTION_ERROR_MESSAGES } from "@features/institutions/constants/error-messages.constants";
import {
  INSTITUTION_LOGO_INTENT,
  INSTITUTION_LOGO_MIME_TYPES,
  MAX_INSTITUTION_LOGO_BYTES,
} from "@features/institutions/constants/institution-logo.constants";
import type {
  InstitutionLogoChange,
  InstitutionLogoSubmission,
  UploadedInstitutionLogo,
} from "@features/institutions/types/institution-logo-change.types";

export function getInstitutionLogoFileError(file: Pick<File, "size" | "type">): string | undefined {
  if (file.size > MAX_INSTITUTION_LOGO_BYTES) {
    return INSTITUTION_ERROR_MESSAGES.LOGO_TOO_LARGE;
  }

  if (!INSTITUTION_LOGO_MIME_TYPES.some((type) => type === file.type) || file.size === 0) {
    return INSTITUTION_ERROR_MESSAGES.LOGO_INVALID_FILE;
  }

  return undefined;
}

export function appendInstitutionLogoChange(formData: FormData, change: InstitutionLogoChange): void {
  formData.set("logoIntent", change.intent);
  formData.delete("logoFile");

  if (change.intent === INSTITUTION_LOGO_INTENT.REPLACE) {
    formData.set("logoFile", change.file);
  }
}

export function appendUploadedInstitutionLogo(formData: FormData, logo: UploadedInstitutionLogo): void {
  formData.delete("logoFile");
  formData.set("logoVersion", logo.version);
  formData.set("logoContentType", logo.contentType);
  formData.set("logoFileSize", String(logo.fileSize));
}

export function parseInstitutionLogoChange(formData: FormData): InstitutionLogoSubmission | { error: string } {
  const intent = formData.get("logoIntent");

  const version = formData.get("logoVersion");

  const contentType = formData.get("logoContentType");

  const fileSize = Number(formData.get("logoFileSize"));

  const hasUpload = version !== null || contentType !== null || formData.get("logoFileSize") !== null;

  if ((intent === INSTITUTION_LOGO_INTENT.KEEP || intent === INSTITUTION_LOGO_INTENT.REMOVE) && !hasUpload) {
    return { intent };
  }

  if (intent !== INSTITUTION_LOGO_INTENT.REPLACE || typeof version !== "string" || typeof contentType !== "string") {
    return { error: INSTITUTION_ERROR_MESSAGES.LOGO_INVALID_CHANGE };
  }

  const error = getInstitutionLogoFileError({ type: contentType, size: fileSize });

  if (error) {
    return { error };
  }

  return { intent, logo: { version, contentType, fileSize } };
}
