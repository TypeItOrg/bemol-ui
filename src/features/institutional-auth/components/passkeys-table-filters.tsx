import type { ReactElement } from "react";

import { DataTableFilters, type DataTableSelectFilter } from "@common/components/ui/data-table-filters";
import { getBooleanFilterValue } from "@common/utils/boolean-filter-value.util";

const USED_FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "true", label: "Usadas" },
  { value: "false", label: "Sin usar" },
] as const;

type UsedFilterValue = (typeof USED_FILTER_OPTIONS)[number]["value"];

type PasskeysTableFiltersProps = {
  search: string;
  used: boolean | undefined;
};

export function PasskeysTableFilters({ search, used }: PasskeysTableFiltersProps): ReactElement {
  const usedValue = getBooleanFilterValue(used);

  const selectFilters: DataTableSelectFilter<UsedFilterValue>[] = [
    {
      defaultValue: "all",
      label: "Uso",
      name: "used",
      options: USED_FILTER_OPTIONS,
      value: usedValue,
    },
  ];

  return <DataTableFilters search={search} searchPlaceholder="Buscar por nombre..." selectFilters={selectFilters} />;
}
