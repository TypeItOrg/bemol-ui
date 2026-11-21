"use server";

import { INVALID_ACTION_ARGUMENTS, isValidUuid } from "@common/utils/action-argument.util";
import { getResponseErrorActionState } from "@common/utils/action-state.util";

import { COURSE_ENROLLMENT_GRADE_BULK_PUBLISH_LIMIT } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import type { BulkPublishClassResult, BulkPublishResult } from "@features/course-enrollments/types/bulk-publish-grades.types";
import { revalidateCourseEnrollmentViews } from "@features/course-enrollments/utils/revalidate-course-enrollment-views.util";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

type PublishBody = {
  publishedGrades?: unknown;
  deletedGrades?: unknown;
  affectedStudents?: unknown;
};

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }

  return 0;
}

export async function publishBulkInstitutionalGradesAction(classIds: string[]): Promise<BulkPublishResult> {
  if (!Array.isArray(classIds) || classIds.length === 0 || classIds.some((id) => !isValidUuid(id))) {
    return { error: INVALID_ACTION_ARGUMENTS };
  }

  const uniqueIds = [...new Set(classIds)];

  if (uniqueIds.length > COURSE_ENROLLMENT_GRADE_BULK_PUBLISH_LIMIT) {
    return { error: `No se pueden publicar más de ${COURSE_ENROLLMENT_GRADE_BULK_PUBLISH_LIMIT} clases por lote.` };
  }

  const user = await requireInstitutionalUser();

  const results: BulkPublishClassResult[] = [];

  for (const classId of uniqueIds) {
    let response: Response;

    try {
      response = await institutionalApiFetch(`/api/v1/institutions/${user.institutionId}/course-classes/${classId}/grades/publish`, {
        method: "POST",
      });
    } catch {
      results.push({
        classId,
        status: "uncertain",
        error: "No se pudo confirmar la publicación. Verificá el estado antes de reintentar.",
      });
      continue;
    }

    if (!response.ok) {
      const failure = await getResponseErrorActionState(Promise.resolve(response), [], "No se pudo publicar la clase.");

      results.push({
        classId,
        status: "failed",
        error: failure?.error ?? "No se pudo publicar la clase.",
      });
      continue;
    }

    let body: PublishBody;

    try {
      body = (await response.json()) as PublishBody;
    } catch {
      results.push({
        classId,
        status: "uncertain",
        error: "Respuesta inesperada. Verificá el estado antes de reintentar.",
      });
      continue;
    }

    if (body === null || typeof body !== "object") {
      results.push({
        classId,
        status: "uncertain",
        error: "Respuesta inesperada. Verificá el estado antes de reintentar.",
      });
      continue;
    }

    results.push({
      classId,
      status: "published",
      publishedGrades: toCount(body.publishedGrades),
      deletedGrades: toCount(body.deletedGrades),
      affectedStudents: toCount(body.affectedStudents),
    });
  }

  let publishedClasses = 0;

  let publishedGrades = 0;

  let deletedGrades = 0;

  let failedClasses = 0;

  const uncertainClassIds: string[] = [];

  for (const result of results) {
    if (result.status === "published") {
      publishedClasses += 1;
      publishedGrades += result.publishedGrades ?? 0;
      deletedGrades += result.deletedGrades ?? 0;
    } else if (result.status === "uncertain") {
      uncertainClassIds.push(result.classId);
    } else {
      failedClasses += 1;
    }
  }

  revalidateCourseEnrollmentViews();

  if (publishedClasses === 0) {
    if (uncertainClassIds.length > 0) {
      return {
        error: "No se pudo confirmar la publicación. Verificá el estado antes de reintentar.",
        failedClasses,
        uncertainClasses: uncertainClassIds.length,
        uncertainClassIds,
        results,
      };
    }

    return { error: "No se pudieron publicar las notas.", failedClasses, results };
  }

  if (failedClasses === 0 && uncertainClassIds.length === 0) {
    return { publishedClasses, publishedGrades, deletedGrades, results };
  }

  return {
    publishedClasses,
    publishedGrades,
    deletedGrades,
    failedClasses,
    uncertainClasses: uncertainClassIds.length,
    uncertainClassIds,
    results,
  };
}
