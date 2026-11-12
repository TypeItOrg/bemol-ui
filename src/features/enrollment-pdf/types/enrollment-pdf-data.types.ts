import type { EnrollmentPdfSettings } from "@features/enrollment-pdf/types/enrollment-pdf-settings.types";

export type EnrollmentPdfData = {
  institutionId: string | null;
  institution: { name: string; address: string; phone: string; email: string };
  generatedAt: string;
  submittedAt: string | null;
  settings: EnrollmentPdfSettings;
  sections: { title: string; fields: { label: string; value: string }[]; allowPageBreaks: boolean }[];
  selections: { name: string; level: string; instrument: string; studyPlan: string; status: string }[];
  coursesSelected: boolean;
  hasResponsible: boolean;
  logoUrl: string | null;
};
