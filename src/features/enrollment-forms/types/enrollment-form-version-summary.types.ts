export type EnrollmentFormVersionSummary = {
  id: string;
  formId: string;
  institutionId: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  revision: number;
  publishedAt: string | null;
  archivedAt: string | null;
};
