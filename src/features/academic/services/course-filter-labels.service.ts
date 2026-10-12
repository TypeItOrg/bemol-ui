import "server-only";

import { fetchPage } from "@features/academic/services/academic-resource-read.service";
import type { CourseFilterLabels } from "@features/academic/types/course-filter-labels.types";
import type { CourseFilterOption } from "@features/academic/types/course-filter-option.types";
import type { Course } from "@features/academic/types/course.types";
import type { AcademicPaginationParams } from "@features/academic/utils/academic-pagination.util";
import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { getAcademicSpaceOptionLabel } from "@features/academic/utils/academic-space-option.util";
import { formatStudyPlanLabel } from "@features/academic/utils/study-plan-label.util";

export async function getCourseFilterLabels(
  scope: AcademicScope,
  institutionId: string,
  params: AcademicPaginationParams,
  courses: readonly Course[],
): Promise<CourseFilterLabels> {
  async function label(
    resource: string,
    id: string | undefined,
    current: string | null | undefined,
    format: (option: CourseFilterOption) => string = (option) => option.name ?? "",
  ) {
    if (!id || id === "none") {
      return undefined;
    }

    if (current) {
      return current;
    }

    const page = await fetchPage<CourseFilterOption>(scope, institutionId, resource, {
      id,
      page: 0,
      size: 1,
      studyPlanId: resource === "courses/levels" ? params.studyPlanId : undefined,
    });

    return page.items[0] ? format(page.items[0]) : undefined;
  }

  const plan = courses.find((course) => course.studyPlanId === params.studyPlanId);

  const space = courses.find((course) => course.academicSpaceId === params.academicSpaceId);

  const [trainingPath, studyPlan, academicSpace, academicLevel, instrument] = await Promise.all([
    label(
      "academic-options/training-paths",
      params.trainingPathId,
      courses.find((course) => course.trainingPathId === params.trainingPathId)?.trainingPathName,
    ),
    label("academic-options/study-plans", params.studyPlanId, plan ? formatStudyPlanLabel(plan) : undefined, formatStudyPlanLabel),
    label(
      "academic-options/academic-spaces",
      params.academicSpaceId,
      space
        ? getAcademicSpaceOptionLabel({ name: space.academicSpaceName, type: space.academicSpaceType, format: space.academicSpaceFormat })
        : undefined,
      getAcademicSpaceOptionLabel,
    ),
    label("courses/levels", params.academicLevelId, courses.find((course) => course.academicLevelId === params.academicLevelId)?.academicLevelName),
    label("academic-options/instruments", params.instrumentId, courses.find((course) => course.instrumentId === params.instrumentId)?.instrumentName),
  ]);

  return { trainingPath, studyPlan, academicSpace, academicLevel, instrument };
}
