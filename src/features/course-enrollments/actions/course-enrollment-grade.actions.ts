"use server";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState, getValidationActionState } from "@common/utils/action-state.util";

import { courseEnrollmentGradeSchema } from "@features/course-enrollments/schemas/course-enrollment-grade.schema";
import { revalidateCourseEnrollmentViews } from "@features/course-enrollments/utils/revalidate-course-enrollment-views.util";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

export type GradeActionResult = {
  error?: string;
  fieldErrors?: Partial<Record<"evaluation" | "value", string>>;
  draft?: boolean;
  pending?: boolean;
  unchanged?: boolean;
  unconfirmed?: boolean;
};

const GRADE_FIELDS = ["evaluation", "value"] as const;

function isValidVersion(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

async function sendGradeRequest(path: string, init: RequestInit, fallbackMessage: string, unchangedIfVersion?: number): Promise<GradeActionResult> {
  const user = await requireInstitutionalUser();

  const response = institutionalApiFetch(`/api/v1/institutions/${user.institutionId}${path}`, init);

  const failure = await getResponseErrorActionState(response, GRADE_FIELDS, fallbackMessage);

  if (failure) {
    return { error: failure.error, fieldErrors: failure.fieldErrors };
  }

  if (unchangedIfVersion === undefined) {
    revalidateCourseEnrollmentViews();

    return {};
  }

  const updateResult = await resolveUpdateResult(await response, unchangedIfVersion);

  if (!updateResult.unchanged) {
    revalidateCourseEnrollmentViews();
  }

  return updateResult;
}

async function resolveUpdateResult(response: Response, expectedVersion: number): Promise<GradeActionResult> {
  try {
    const body = (await response.json()) as { version?: unknown };

    if (body.version === expectedVersion) {
      return { unchanged: true };
    }
  } catch {
    return { unconfirmed: true };
  }

  return { pending: true };
}

async function saveGrade(path: string, formData: FormData, expectedVersion?: number): Promise<GradeActionResult> {
  const parsed = courseEnrollmentGradeSchema.safeParse({
    evaluation: formData.get("evaluation") ?? "",
    value: formData.get("value") ?? "",
  });

  if (!parsed.success) {
    const validation = getValidationActionState(parsed.error.issues, GRADE_FIELDS);

    return { error: validation.error, fieldErrors: validation.fieldErrors };
  }

  const isUpdate = expectedVersion !== undefined;

  const result = await sendGradeRequest(
    path,
    {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isUpdate ? { ...parsed.data, expectedVersion } : parsed.data),
    },
    "No se pudo guardar la nota.",
    expectedVersion,
  );

  if (result.error) {
    return result;
  }

  return isUpdate ? result : { draft: true };
}

export async function createInstitutionalGradeAction(enrollmentId: string, formData: FormData): Promise<GradeActionResult> {
  if (!isValidUuid(enrollmentId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return saveGrade(`/course-enrollments/${enrollmentId}/grades`, formData);
}

export async function updateInstitutionalGradeAction(
  enrollmentId: string,
  gradeId: string,
  expectedVersion: number,
  formData: FormData,
): Promise<GradeActionResult> {
  if (!isValidUuid(enrollmentId) || !isValidUuid(gradeId) || !isValidVersion(expectedVersion)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return saveGrade(`/course-enrollments/${enrollmentId}/grades/${gradeId}`, formData, expectedVersion);
}

export async function deleteInstitutionalGradeAction(enrollmentId: string, gradeId: string, expectedVersion?: number): Promise<GradeActionResult> {
  if (!isValidUuid(enrollmentId) || !isValidUuid(gradeId) || (expectedVersion !== undefined && !isValidVersion(expectedVersion))) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const params = expectedVersion !== undefined ? `?expectedVersion=${expectedVersion}` : "";

  return sendGradeRequest(`/course-enrollments/${enrollmentId}/grades/${gradeId}${params}`, { method: "DELETE" }, "No se pudo eliminar la nota.");
}

export async function cancelInstitutionalGradeDeletionAction(
  enrollmentId: string,
  gradeId: string,
  expectedVersion?: number,
): Promise<GradeActionResult> {
  if (!isValidUuid(enrollmentId) || !isValidUuid(gradeId) || (expectedVersion !== undefined && !isValidVersion(expectedVersion))) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const params = expectedVersion !== undefined ? `?expectedVersion=${expectedVersion}` : "";

  return sendGradeRequest(
    `/course-enrollments/${enrollmentId}/grades/${gradeId}/cancel-deletion${params}`,
    { method: "POST" },
    "No se pudo deshacer la eliminación.",
  );
}

export async function publishInstitutionalGradesAction(classId: string): Promise<GradeActionResult> {
  if (!isValidUuid(classId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return sendGradeRequest(`/course-classes/${classId}/grades/publish`, { method: "POST" }, "No se pudieron publicar las notas.");
}

export async function createTeacherGradeAction(classId: string, enrollmentId: string, formData: FormData): Promise<GradeActionResult> {
  if (!isValidUuid(classId) || !isValidUuid(enrollmentId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return saveGrade(`/teacher/classes/${classId}/enrollments/${enrollmentId}/grades`, formData);
}

export async function updateTeacherGradeAction(
  classId: string,
  enrollmentId: string,
  gradeId: string,
  expectedVersion: number,
  formData: FormData,
): Promise<GradeActionResult> {
  if (!isValidUuid(classId) || !isValidUuid(enrollmentId) || !isValidUuid(gradeId) || !isValidVersion(expectedVersion)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return saveGrade(`/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/${gradeId}`, formData, expectedVersion);
}

export async function deleteTeacherGradeAction(
  classId: string,
  enrollmentId: string,
  gradeId: string,
  expectedVersion?: number,
): Promise<GradeActionResult> {
  if (
    !isValidUuid(classId) ||
    !isValidUuid(enrollmentId) ||
    !isValidUuid(gradeId) ||
    (expectedVersion !== undefined && !isValidVersion(expectedVersion))
  ) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const params = expectedVersion !== undefined ? `?expectedVersion=${expectedVersion}` : "";

  return sendGradeRequest(
    `/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/${gradeId}${params}`,
    { method: "DELETE" },
    "No se pudo eliminar la nota.",
  );
}

export async function cancelTeacherGradeDeletionAction(
  classId: string,
  enrollmentId: string,
  gradeId: string,
  expectedVersion?: number,
): Promise<GradeActionResult> {
  if (
    !isValidUuid(classId) ||
    !isValidUuid(enrollmentId) ||
    !isValidUuid(gradeId) ||
    (expectedVersion !== undefined && !isValidVersion(expectedVersion))
  ) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const params = expectedVersion !== undefined ? `?expectedVersion=${expectedVersion}` : "";

  return sendGradeRequest(
    `/teacher/classes/${classId}/enrollments/${enrollmentId}/grades/${gradeId}/cancel-deletion${params}`,
    { method: "POST" },
    "No se pudo deshacer la eliminación.",
  );
}

export async function publishTeacherGradesAction(classId: string): Promise<GradeActionResult> {
  if (!isValidUuid(classId)) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  return sendGradeRequest(`/teacher/classes/${classId}/grades/publish`, { method: "POST" }, "No se pudieron publicar las notas.");
}
