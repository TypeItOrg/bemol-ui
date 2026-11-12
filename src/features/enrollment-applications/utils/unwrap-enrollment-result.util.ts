import type { ChangeEnrollmentCareerResult } from "@features/enrollment-applications/types/change-enrollment-career-result.types";

export class EnrollmentMutationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "EnrollmentMutationError";
  }
}

export function unwrapEnrollmentResult(result: ChangeEnrollmentCareerResult) {
  if (result.error !== undefined) {
    throw new EnrollmentMutationError(result.error, result.status, result.fieldErrors);
  }

  return result.application;
}
