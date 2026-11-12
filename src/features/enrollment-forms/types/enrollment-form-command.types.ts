import type { z } from "zod";

import type { enrollmentFormCommandSchema } from "@features/enrollment-forms/schemas/enrollment-form-command.schema";

export type EnrollmentFormCommand = z.infer<typeof enrollmentFormCommandSchema>;
