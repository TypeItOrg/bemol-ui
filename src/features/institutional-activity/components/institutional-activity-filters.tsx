"use client";

import type { ReactElement } from "react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { DataTableAdvancedFiltersTrigger } from "@common/components/ui/data-table-advanced-filters-trigger";
import { DataTableFilterSelect } from "@common/components/ui/data-table-filter-select";
import { DataTableFilters } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { Sheet } from "@common/components/ui/sheet";
import { countActiveAdvancedFilters } from "@common/utils/count-active-advanced-filters.util";

import { MAIL_RESULT_LABELS, MAIL_TYPE_LABELS } from "@features/platform-audit/constants/mail-labels.constants";
import { fetchAuditActionOptions } from "@features/platform-audit/services/fetch-audit-actions.service";
import type { AuditActionOption } from "@features/platform-audit/types/audit-action-option.types";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditModuleOption } from "@features/platform-audit/types/audit-module-option.types";
import { PlatformCollectionActions } from "@features/platform-auth/components/platform-collection-actions";

export function InstitutionalActivityFilters({
  filters,
  modules,
  selectedActionLabel,
  institutionId,
}: {
  filters: AuditFilters;
  modules: AuditModuleOption[];
  selectedActionLabel?: string;
  institutionId: string;
}): ReactElement {
  const { navigate } = useDataTableNavigation();

  const mailView = filters.module === "EMAILS";

  const advancedDateFilters = [
    { name: "from", label: "Desde", value: filters.from },
    { name: "to", label: "Hasta", value: filters.to },
  ];

  function update(values: Record<string, string | undefined>): void {
    navigate({ ...values, page: "0", size: String(filters.size) }, { replace: true });
  }

  return (
    <Sheet>
      <PlatformCollectionActions>
        <DataTableAdvancedFiltersTrigger count={countActiveAdvancedFilters({ advancedDateFilters })} label="Filtros avanzados" />
      </PlatformCollectionActions>
      <DataTableFilters
        triggerPosition="external"
        size={filters.size}
        search={filters.search ?? ""}
        searchPlaceholder={mailView ? "Buscar por destinatario…" : "Buscar en la auditoría…"}
        advancedDateFilters={advancedDateFilters}
        advancedDescription="Refiná por el período en que se registró la actividad."
      >
        <DataTableFilterSelect
          filter={{
            name: mailView ? "mailType" : "module",
            label: mailView ? "Tipo de correo" : "Módulo",
            defaultValue: "all",
            value: (mailView ? filters.mailType : filters.module) ?? "all",
            options: [
              { value: "all", label: mailView ? "Todos los tipos" : "Todos los módulos" },
              ...(mailView
                ? Object.entries(MAIL_TYPE_LABELS).map(([value, label]) => ({ value, label }))
                : modules.map(({ code, label }) => ({ value: code, label }))),
            ],
          }}
          onValueChange={(value) => {
            if (mailView) {
              update({ mailType: value === "all" ? undefined : value });
            } else {
              update({ module: value === "all" ? undefined : value, action: undefined });
            }
          }}
        />
        {mailView ? (
          <DataTableFilterSelect
            filter={{
              name: "action",
              label: mailView ? "Resultado" : "Acción",
              defaultValue: "all",
              value: filters.action ?? "all",
              options: [
                { value: "all", label: mailView ? "Todos los resultados" : "Todas las acciones" },
                ...Object.entries(MAIL_RESULT_LABELS).map(([value, label]) => ({ value, label })),
              ],
            }}
            onValueChange={(value) => update({ action: value === "all" ? undefined : value })}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="institutional-audit-action" className="text-foreground text-sm font-medium">
              Acción
            </label>
            <AsyncDropdown<AuditActionOption>
              id="institutional-audit-action"
              clearable
              clearLabel="Limpiar acción"
              defaultOption={{ label: "Todas las acciones", value: undefined }}
              fetchPage={(input) => fetchAuditActionOptions(input, filters.module, true)}
              getItemLabel={(action) => action.label}
              getItemGroup={filters.module ? undefined : (action) => action.moduleLabel}
              getItemValue={(action) => action.action}
              onValueChange={(value) => update({ action: value })}
              pageSize={20}
              placeholder="Seleccionar acción"
              searchPlaceholder="Buscar acción…"
              emptyMessage="No se encontraron acciones."
              errorMessage="No se pudieron cargar las acciones. Intentá nuevamente."
              queryKey={["institutional", institutionId, "audit-actions", filters.module]}
              selectedLabel={selectedActionLabel ?? filters.action}
              value={filters.action}
            />
          </div>
        )}
      </DataTableFilters>
    </Sheet>
  );
}
