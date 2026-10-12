import type { ReactElement } from "react";

import type { DataTableDateFilter } from "@common/types/data-table-date-filter.types";
import type { DataTableSelectFilter } from "@common/types/data-table-select-filter.types";
import type { DataTableYearFilter } from "@common/types/data-table-year-filter.types";

import { AcademicTableFilters } from "@features/academic/components/academic-table-filters";
import type { AcademicCollectionConfig } from "@features/academic/types/academic-collection-config.types";
import type { AcademicCollection } from "@features/academic/types/academic-collection.types";
import type { CourseFilterLabels } from "@features/academic/types/course-filter-labels.types";
import { academicSpaceFormatLabels, academicSpaceTypeLabels } from "@features/academic/utils/academic-labels.util";
import type { AcademicPaginationParams } from "@features/academic/utils/academic-pagination.util";
import { formatStudyPlanLabel } from "@features/academic/utils/study-plan-label.util";

export function AcademicCollectionFilters({
  scope,
  isCourse,
  effectiveInstitutionId,
  selectedAcademicSpace,
  courseFilterLabels,
  params,
  activeAdvancedCount,
  advancedDateFilters,
  advancedResetKeys,
  advancedSelectFilters,
  advancedYearFilters,
  isAcademicYear,
  isStudyPlan,
  dateFilters,
  primarySelectFilters,
  global,
  institutionName,
  config,
  selectedStudyPlan,
  isTrainingPathFixed,
  selectedTrainingPath,
  useAdvancedFilters,
  yearFilters,
}: {
  scope: import("@features/academic/utils/academic-scope.util").AcademicScope;
  isCourse: boolean;
  effectiveInstitutionId: string | undefined;
  selectedAcademicSpace: AcademicCollection | undefined;
  courseFilterLabels?: CourseFilterLabels;
  params: AcademicPaginationParams;
  activeAdvancedCount: number;
  advancedDateFilters: readonly DataTableDateFilter[];
  advancedResetKeys: string[];
  advancedSelectFilters: DataTableSelectFilter[];
  advancedYearFilters: readonly DataTableYearFilter[];
  isAcademicYear: boolean;
  isStudyPlan: boolean;
  dateFilters: readonly DataTableDateFilter[];
  primarySelectFilters: readonly DataTableSelectFilter[];
  global: boolean;
  institutionName: string | undefined;
  config: AcademicCollectionConfig;
  selectedStudyPlan: AcademicCollection | undefined;
  isTrainingPathFixed: boolean;
  selectedTrainingPath: AcademicCollection | undefined;
  useAdvancedFilters: boolean;
  yearFilters: readonly DataTableYearFilter[];
}): ReactElement {
  return (
    <AcademicTableFilters
      academicSpaceFilter={
        isCourse && effectiveInstitutionId
          ? {
              institutionId: effectiveInstitutionId,
              selectedLabel:
                courseFilterLabels?.academicSpace ??
                (selectedAcademicSpace && "academicSpaceName" in selectedAcademicSpace
                  ? `${selectedAcademicSpace.academicSpaceName} · ${academicSpaceTypeLabels[selectedAcademicSpace.academicSpaceType]} · ${academicSpaceFormatLabels[selectedAcademicSpace.academicSpaceFormat]}`
                  : undefined),
              scope,
              value: params.academicSpaceId,
            }
          : undefined
      }
      academicLevelFilter={
        isCourse && effectiveInstitutionId
          ? {
              institutionId: effectiveInstitutionId,
              scope,
              studyPlanId: params.studyPlanId,
              value: params.academicLevelId,
              selectedLabel: courseFilterLabels?.academicLevel,
            }
          : undefined
      }
      instrumentFilter={
        isCourse && effectiveInstitutionId
          ? {
              institutionId: effectiveInstitutionId,
              scope,
              value: params.instrumentId,
              selectedLabel: courseFilterLabels?.instrument,
            }
          : undefined
      }
      activeAdvancedCount={activeAdvancedCount}
      advancedDateFilters={advancedDateFilters}
      advancedResetKeys={advancedResetKeys}
      advancedSelectFilters={advancedSelectFilters}
      advancedYearFilters={advancedYearFilters}
      cycleFilter={
        isCourse && effectiveInstitutionId
          ? {
              institutionId: effectiveInstitutionId,
              selectedLabel: params.year !== undefined ? String(params.year) : undefined,
              scope,
              value: params.year !== undefined ? String(params.year) : undefined,
            }
          : undefined
      }
      dateFilters={isAcademicYear || isStudyPlan ? [] : dateFilters}
      filters={primarySelectFilters}
      institutionFilter={
        global
          ? {
              selectedLabel: institutionName,
              value: params.institutionId,
            }
          : undefined
      }
      search={params.search}
      searchable={config.searchable !== false}
      searchPlaceholder={global ? "Buscar por registro o institución..." : config.searchPlaceholder}
      size={params.size}
      studyPlanFilter={
        isCourse && effectiveInstitutionId
          ? {
              institutionId: effectiveInstitutionId,
              selectedLabel:
                courseFilterLabels?.studyPlan ??
                (selectedStudyPlan && "studyPlanName" in selectedStudyPlan ? formatStudyPlanLabel(selectedStudyPlan) : undefined),
              trainingPathId: params.trainingPathId,
              scope,
              value: params.studyPlanId,
            }
          : undefined
      }
      trainingPathFilter={
        (isStudyPlan || isCourse) && !isTrainingPathFixed && effectiveInstitutionId
          ? {
              institutionId: effectiveInstitutionId,
              selectedLabel:
                courseFilterLabels?.trainingPath ??
                (selectedTrainingPath && "trainingPathName" in selectedTrainingPath ? selectedTrainingPath.trainingPathName : undefined),
              resetCourseFilters: isCourse,
              scope,
              value: params.trainingPathId,
            }
          : undefined
      }
      triggerPosition={useAdvancedFilters ? "external" : undefined}
      yearFilters={isAcademicYear ? [] : yearFilters}
    />
  );
}
