import type { AcademicSortField } from "@features/academic/utils/academic-pagination.util";

export type AcademicTableColumns = {
  primaryLabel: string;
  detailLabels: readonly string[];
  statusSortField?: AcademicSortField;
  institutionSortField?: AcademicSortField;
  sortableFields?: readonly (AcademicSortField | undefined)[];
};
