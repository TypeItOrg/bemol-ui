import type { INSTITUTION_LOGO_INTENT } from "@features/institutions/constants/institution-logo.constants";

export type InstitutionLogoChange =
  | { intent: typeof INSTITUTION_LOGO_INTENT.KEEP | typeof INSTITUTION_LOGO_INTENT.REMOVE }
  | { intent: typeof INSTITUTION_LOGO_INTENT.REPLACE; file: File };

export type UploadedInstitutionLogo = {
  version: string;
  contentType: string;
  fileSize: number;
};

export type InstitutionLogoSubmission =
  | { intent: typeof INSTITUTION_LOGO_INTENT.KEEP | typeof INSTITUTION_LOGO_INTENT.REMOVE }
  | { intent: typeof INSTITUTION_LOGO_INTENT.REPLACE; logo: UploadedInstitutionLogo };

export type InstitutionLogoScope = "platform" | "institutional";
