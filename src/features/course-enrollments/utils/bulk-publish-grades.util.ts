import type { PendingClassGrades } from "@features/course-enrollments/types/pending-class-grades.types";

export function chunkClassIds(classIds: string[], size: number): string[][] {
  return Array.from({ length: Math.ceil(classIds.length / size) }, (_, index) => classIds.slice(index * size, (index + 1) * size));
}

export function formatPendingSummary(count: number): string {
  if (count <= 0) {
    return "Sin cambios en la selección.";
  }

  return count === 1 ? "1 cambio pendiente en la selección." : `${count} cambios pendientes en la selección.`;
}

export function buildBulkPublishCourseOptions(classes: PendingClassGrades[]): Array<{ id: string; name: string }> {
  const byId = new Map<string, string>();

  for (const pending of classes) {
    if (!byId.has(pending.courseId)) {
      byId.set(pending.courseId, pending.courseName);
    }
  }

  return [...byId.entries()].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name, "es"));
}
