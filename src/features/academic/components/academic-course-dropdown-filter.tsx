"use client";

import { useCallback, useId, useMemo, type ReactElement } from "react";

import { LibraryBigIcon } from "lucide-react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import type { AsyncDropdownFetchPageInput } from "@common/types/async-dropdown-fetch-page-input.types";

import { TRAINING_PATH_FILTER_PAGE_SIZE } from "@features/academic/components/academic-training-path-filter";
import { fetchAcademicOptionPage } from "@features/academic/services/academic-options.service";
import { fetchCourseLevelOptions } from "@features/academic/services/course-options.service";
import type { CourseFilterOption } from "@features/academic/types/course-filter-option.types";
import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { ACADEMIC_SPACE_OPTION_PRESENTATION, getAcademicSpaceOptionLabel } from "@features/academic/utils/academic-space-option.util";
import { formatStudyPlanLabel } from "@features/academic/utils/study-plan-label.util";

export function CourseDropdownFilterControl({
  emptyIcon,
  filter,
  label,
  navigateKey,
  resource,
  searchPlaceholder,
  size,
}: CourseDropdownFilterControlProps): ReactElement {
  const { navigate } = useDataTableNavigation();

  const labelId = useId();

  const defaultLabel = {
    "study-plans": "Todos los planes de estudio",
    "academic-spaces": "Todos los espacios académicos",
    levels: "Todos los niveles",
    instruments: "Todos los instrumentos",
  }[resource];

  const disabled = resource === "levels" && !filter.studyPlanId;

  const queryKey = useMemo(
    () => ["academic", "course-filter", resource, filter.scope, filter.institutionId, filter.trainingPathId, filter.studyPlanId],
    [filter.institutionId, filter.scope, filter.trainingPathId, filter.studyPlanId, resource],
  );

  function updateFilter(value: string | undefined): void {
    navigate(
      {
        page: "0",
        size: String(size),
        [navigateKey]: value,
        ...(navigateKey === "studyPlanId" ? { academicLevelId: undefined } : {}),
      },
      { replace: true },
    );
  }

  const fetchPage = useCallback(
    async (input: AsyncDropdownFetchPageInput) => {
      if (resource === "levels") {
        if (!filter.studyPlanId) {
          return { items: [], nextPage: null };
        }

        return fetchCourseLevelOptions(filter.scope, filter.institutionId, filter.studyPlanId, input);
      }

      const page = await fetchAcademicOptionPage<CourseFilterOption>(resource, filter.scope, filter.institutionId, input, {
        active: "all",
        trainingPathId: resource === "study-plans" ? filter.trainingPathId : undefined,
      });

      if (resource === "instruments" && input.page === 0 && "sin instrumento".includes(input.search.trim().toLowerCase())) {
        return { ...page, items: [{ id: "none", name: "Sin instrumento" }, ...page.items] };
      }

      return page;
    },
    [filter.institutionId, filter.scope, filter.trainingPathId, filter.studyPlanId, resource],
  );

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={labelId} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <AsyncDropdown<CourseFilterOption>
        id={labelId}
        disabled={disabled}
        {...(resource === "academic-spaces" ? ACADEMIC_SPACE_OPTION_PRESENTATION : {})}
        className="min-w-0"
        clearLabel={`Limpiar ${label.toLowerCase()}`}
        clearable
        defaultOption={{ label: disabled ? "Seleccioná un plan de estudio" : defaultLabel, value: undefined }}
        emptyMessage="No se encontraron opciones."
        emptyIcon={emptyIcon}
        errorMessage="No se pudieron cargar las opciones."
        fetchPage={fetchPage}
        getItemLabel={(item) => {
          if (resource === "study-plans") {
            return formatStudyPlanLabel(item);
          }

          if (item.type && item.format) {
            return getAcademicSpaceOptionLabel(item);
          }

          return item.year != null ? String(item.year) : (item.name ?? "");
        }}
        getItemValue={(item) => item.id}
        pageSize={TRAINING_PATH_FILTER_PAGE_SIZE}
        onValueChange={updateFilter}
        placeholder={disabled ? "Seleccioná un plan de estudio" : `Seleccionar ${label.toLowerCase()}`}
        queryKey={queryKey}
        searchPlaceholder={searchPlaceholder}
        selectedLabel={filter.value === "none" ? "Sin instrumento" : (filter.selectedLabel ?? (filter.value ? "Opción no disponible" : undefined))}
        value={filter.value}
      />
    </div>
  );
}

export type CourseDropdownFilterControlProps = {
  emptyIcon: typeof LibraryBigIcon;
  filter: CourseDropdownFilter;
  label: string;
  navigateKey: "studyPlanId" | "academicSpaceId" | "academicLevelId" | "instrumentId";
  resource: "study-plans" | "academic-spaces" | "levels" | "instruments";
  searchPlaceholder: string;
  size: number;
};

export type CourseDropdownFilter = {
  trainingPathId?: string;
  studyPlanId?: string;
  institutionId: string;
  scope: AcademicScope;
  selectedLabel: string | undefined;
  value: string | undefined;
};
