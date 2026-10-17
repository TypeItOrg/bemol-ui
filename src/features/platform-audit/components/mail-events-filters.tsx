"use client";

import type { ReactElement } from "react";

import { DataTableAdvancedFiltersTrigger } from "@common/components/ui/data-table-advanced-filters-trigger";
import { DataTableFilterSelect } from "@common/components/ui/data-table-filter-select";
import { DataTableFilters } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { Sheet } from "@common/components/ui/sheet";
import { countActiveAdvancedFilters } from "@common/utils/count-active-advanced-filters.util";

import { AuditIdentifierFilter } from "@features/platform-audit/components/audit-identifier-filter";
import { AuditInstitutionFilter } from "@features/platform-audit/components/audit-institution-filter";
import { MAIL_RESULT_LABELS, MAIL_TYPE_LABELS } from "@features/platform-audit/constants/mail-labels.constants";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import { PlatformCollectionActions } from "@features/platform-auth/components/platform-collection-actions";

export function MailEventsFilters({ filters, institutionName }: { filters: AuditFilters; institutionName?: string }): ReactElement {
  const { navigate } = useDataTableNavigation();

  function update(values: Record<string, string | undefined>): void {
    navigate({ ...values, page: "0", size: String(filters.size) }, { replace: true });
  }

  const activeAdvancedCount = [filters.institutionId, filters.requestId].filter(Boolean).length;

  const advancedDateFilters = [
    { name: "from", label: "Desde", value: filters.from },
    { name: "to", label: "Hasta", value: filters.to },
  ];

  const count = countActiveAdvancedFilters({ activeAdvancedCount, advancedDateFilters });

  return (
    <Sheet>
      <PlatformCollectionActions>
        <DataTableAdvancedFiltersTrigger count={count} label="Filtros avanzados" />
      </PlatformCollectionActions>
      <DataTableFilters
        triggerPosition="external"
        size={filters.size}
        search={filters.search ?? ""}
        searchPlaceholder="Buscar por destinatario…"
        advancedDateFilters={advancedDateFilters}
        activeAdvancedCount={activeAdvancedCount}
        advancedResetKeys={["institutionId", "requestId"]}
        advancedDescription="Refiná por institución, período o identificador de la petición."
        advancedFilters={
          <div className="flex min-w-0 flex-col gap-4">
            <AuditInstitutionFilter
              value={filters.institutionId}
              selectedLabel={institutionName}
              onValueChange={(value) => update({ institutionId: value })}
            />
            <AuditIdentifierFilter
              key={`request-${filters.requestId}`}
              label="Identificador de la petición"
              value={filters.requestId}
              onCommit={(value) => update({ requestId: value })}
            />
          </div>
        }
      >
        <DataTableFilterSelect
          filter={{
            name: "mailType",
            label: "Tipo de correo",
            defaultValue: "all",
            value: filters.mailType ?? "all",
            options: [{ value: "all", label: "Todos los tipos" }, ...Object.entries(MAIL_TYPE_LABELS).map(([value, label]) => ({ value, label }))],
          }}
          onValueChange={(value) => update({ mailType: value === "all" ? undefined : value })}
        />
        <DataTableFilterSelect
          filter={{
            name: "action",
            label: "Resultado",
            defaultValue: "all",
            value: filters.action ?? "all",
            options: [
              { value: "all", label: "Todos los resultados" },
              ...Object.entries(MAIL_RESULT_LABELS).map(([value, label]) => ({ value, label })),
            ],
          }}
          onValueChange={(value) => update({ action: value === "all" ? undefined : value })}
        />
      </DataTableFilters>
    </Sheet>
  );
}
