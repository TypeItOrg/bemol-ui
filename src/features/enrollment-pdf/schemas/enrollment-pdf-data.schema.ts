import { z } from "zod";

import type { EnrollmentPdfData } from "@features/enrollment-pdf/types/enrollment-pdf-data.types";

export const enrollmentPdfDataSchema = z.object({
  institutionId: z.string().nullable(),
  institution: z.object({ name: z.string(), address: z.string(), phone: z.string(), email: z.string() }),
  generatedAt: z.iso.datetime({ offset: true }),
  submittedAt: z.iso.datetime({ offset: true }).nullable(),
  settings: z.object({
    title: z.string(),
    headerText: z.string().nullable(),
    introductionText: z.string().nullable(),
    footerText: z.string().nullable(),
    showApplicantSignature: z.boolean(),
    showResponsibleSignature: z.boolean(),
  }),
  sections: z.array(
    z.object({
      title: z.string(),
      fields: z.array(z.object({ label: z.string(), value: z.string() })),
      allowPageBreaks: z.boolean(),
    }),
  ),
  selections: z.array(z.object({ name: z.string(), level: z.string(), instrument: z.string(), studyPlan: z.string(), status: z.string() })),
  coursesSelected: z.boolean(),
  hasResponsible: z.boolean(),
  logoUrl: z.string().nullable(),
}) satisfies z.ZodType<EnrollmentPdfData>;
