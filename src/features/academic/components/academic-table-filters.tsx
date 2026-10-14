"use client";

import type { ReactElement } from "react";

import { LayersIcon, LibraryBigIcon, Music2Icon, RouteIcon } from "lucide-react";

import {
  type DataTableDateFilter,
  DataTableFilters,
  type DataTableSelectFilter,
  type DataTableTriggerPosition,
  type DataTableYearFilter,
} from "@common/components/ui/data-table-filters";

import { type CourseDropdownFilter, CourseDropdownFilterControl } from "@features/academic/components/academic-course-dropdown-filter";
import { CycleFilterControl } from "@features/academic/components/academic-cycle-filter";
import { InstitutionFilterControl } from "@features/academic/components/academic-institution-filter";
import { type TrainingPathFilter, TrainingPathFilterControl } from "@features/academic/components/academic-training-path-filter";

type AcademicTableFiltersProps = {
  academicSpaceFilter?: CourseDropdownFilter;
  academicLevelFilter?: CourseDropdownFilter;
  instrumentFilter?: CourseDropdownFilter;
  activeAdvancedCount?: number;
  advancedDateFilters?: readonly DataTableDateFilter[];
  advancedResetKeys?: readonly string[];
  advancedSelectFilters?: readonly DataTableSelectFilter[];
  advancedYearFilters?: readonly DataTableYearFilter[];
  cycleFilter?: CourseDropdownFilter;
  dateFilters: readonly DataTableDateFilter[];
  filters: readonly DataTableSelectFilter[];
  institutionFilter?: { selectedLabel?: string; value?: string };
  search: string;
  searchPlaceholder?: string;
  searchable: boolean;
  size: number;
  studyPlanFilter?: CourseDropdownFilter;
  trainingPathFilter?: TrainingPathFilter;
  triggerPosition?: DataTableTriggerPosition;
  yearFilters: readonly DataTableYearFilter[];
};

export function AcademicTableFilters({
  academicSpaceFilter,
  academicLevelFilter,
  instrumentFilter,
  activeAdvancedCount = 0,
  advancedDateFilters = [],
  advancedResetKeys,
  advancedSelectFilters = [],
  advancedYearFilters = [],
  cycleFilter,
  dateFilters,
  filters,
  institutionFilter,
  search,
  searchPlaceholder,
  searchable,
  size,
  studyPlanFilter,
  trainingPathFilter,
  triggerPosition = "inline",
  yearFilters,
}: AcademicTableFiltersProps): ReactElement {
  const useAdvancedLayout =
    triggerPosition === "external" || advancedSelectFilters.length > 0 || advancedDateFilters.length > 0 || advancedYearFilters.length > 0;

  const institutionNode = institutionFilter ? <InstitutionFilterControl filter={institutionFilter} size={size} /> : null;

  const studyPlanNode = studyPlanFilter ? (
    <CourseDropdownFilterControl
      emptyIcon={RouteIcon}
      filter={studyPlanFilter}
      label="Plan de estudio"
      navigateKey="studyPlanId"
      resource="study-plans"
      searchPlaceholder="Buscar plan…"
      size={size}
    />
  ) : null;

  const academicSpaceNode = academicSpaceFilter ? (
    <CourseDropdownFilterControl
      emptyIcon={LibraryBigIcon}
      filter={academicSpaceFilter}
      label="Espacio académico"
      navigateKey="academicSpaceId"
      resource="academic-spaces"
      searchPlaceholder="Buscar espacio…"
      size={size}
    />
  ) : null;

  return (
    <DataTableFilters
      activeAdvancedCount={activeAdvancedCount}
      advancedDateFilters={advancedDateFilters}
      advancedFilters={
        useAdvancedLayout ? (
          <>
            {institutionNode}
            {trainingPathFilter?.resetCourseFilters ? <TrainingPathFilterControl filter={trainingPathFilter} size={size} /> : null}
            {studyPlanNode}
            {academicLevelFilter ? (
              <CourseDropdownFilterControl
                emptyIcon={LayersIcon}
                filter={academicLevelFilter}
                label="Nivel"
                navigateKey="academicLevelId"
                resource="levels"
                searchPlaceholder="Buscar nivel…"
                size={size}
              />
            ) : null}
            {academicSpaceNode}
            {instrumentFilter ? (
              <CourseDropdownFilterControl
                emptyIcon={Music2Icon}
                filter={instrumentFilter}
                label="Instrumento"
                navigateKey="instrumentId"
                resource="instruments"
                searchPlaceholder="Buscar instrumento…"
                size={size}
              />
            ) : null}
          </>
        ) : undefined
      }
      advancedResetKeys={advancedResetKeys}
      advancedSelectFilters={advancedSelectFilters}
      advancedYearFilters={advancedYearFilters}
      dateFilters={dateFilters}
      search={searchable ? search : undefined}
      searchPlaceholder={searchable ? (searchPlaceholder ?? "Buscar por nombre…") : undefined}
      selectFilters={filters}
      size={size}
      triggerPosition={triggerPosition}
      yearFilters={yearFilters}
    >
      {useAdvancedLayout ? null : institutionNode}
      {trainingPathFilter && !trainingPathFilter.resetCourseFilters ? <TrainingPathFilterControl filter={trainingPathFilter} size={size} /> : null}
      {useAdvancedLayout ? null : studyPlanNode}
      {useAdvancedLayout ? null : academicSpaceNode}
      {cycleFilter ? <CycleFilterControl filter={cycleFilter} size={size} /> : null}
    </DataTableFilters>
  );
}
