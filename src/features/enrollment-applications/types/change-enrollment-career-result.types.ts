import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";

export type ChangeEnrollmentCareerResult =
  | { application: EnrollmentApplicationResponse; error?: never }
  | { error: string; status?: number; fieldErrors?: Record<string, string>; application?: never };
