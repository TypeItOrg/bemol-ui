import { parseHttpResponse } from "@common/utils/http-response-error.util";

import type { PendingClassGrades } from "@features/course-enrollments/types/pending-class-grades.types";

export async function fetchPendingClassesClient(signal?: AbortSignal): Promise<PendingClassGrades[]> {
  const response = await fetch("/api/institutional/course-classes/grades/pending-classes", { cache: "no-store", signal });

  return parseHttpResponse(response, "No se pudieron cargar las clases con cambios pendientes.");
}
