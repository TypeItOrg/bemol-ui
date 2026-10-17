"use client";

import type { ReactElement } from "react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { DataTableAdvancedFiltersTrigger } from "@common/components/ui/data-table-advanced-filters-trigger";
import { DataTableFilterSelect } from "@common/components/ui/data-table-filter-select";
import { DataTableFilters } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { Sheet } from "@common/components/ui/sheet";
import { countActiveAdvancedFilters } from "@common/utils/count-active-advanced-filters.util";

import { AuditEventsAdvancedFilters } from "@features/platform-audit/components/audit-events-advanced-filters";
import { AUDIT_MODULE_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import { fetchAuditPersonOptions } from "@features/platform-audit/services/fetch-audit-people.service";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditPersonOption } from "@features/platform-audit/types/audit-person-option.types";
import { PlatformCollectionActions } from "@features/platform-auth/components/platform-collection-actions";

export function AuditEventsFilters({
  filters,
  institutionName,
  selectedActorLabel,
  selectedPersonLabel,
}: {
  filters: AuditFilters;
  institutionName?: string;
  selectedActorLabel?: string;
  selectedPersonLabel?: string;
}): ReactElement {
  const { navigate } = useDataTableNavigation();

  function update(values: Record<string, string | undefined>): void {
    navigate(
      {
        personId: filters.personId,
        ...values,
        subjectPersonId: undefined,
        entityType: undefined,
        entityId: undefined,
        page: "0",
        size: String(filters.size),
      },
      { replace: true },
    );
  }

  const activeAdvancedCount = [filters.action, filters.actorKind, filters.actorId, filters.scope, filters.institutionId, filters.requestId].filter(
    Boolean,
  ).length;

  const advancedDateFilters = [
    { name: "from", label: "Desde", value: filters.from },
    { name: "to", label: "Hasta", value: filters.to },
  ];

  const advancedCount = countActiveAdvancedFilters({ activeAdvancedCount, advancedDateFilters });

  return (
    <Sheet>
      <PlatformCollectionActions>
        <DataTableAdvancedFiltersTrigger count={advancedCount} label="Filtros avanzados" />
      </PlatformCollectionActions>
      <DataTableFilters
        triggerPosition="external"
        size={filters.size}
        search={filters.search ?? ""}
        searchPlaceholder="Buscar en la auditoría…"
        advancedDateFilters={advancedDateFilters}
        activeAdvancedCount={activeAdvancedCount}
        advancedResetKeys={["action", "actorKind", "actorId", "scope", "institutionId", "requestId"]}
        advancedDescription="Refiná por institución, período o detalles de la operación."
        advancedFilters={
          <AuditEventsAdvancedFilters filters={filters} institutionName={institutionName} selectedActorLabel={selectedActorLabel} onChange={update} />
        }
      >
        <DataTableFilterSelect
          filter={{
            name: "module",
            label: "Módulo",
            defaultValue: "all",
            value: filters.module ?? "all",
            options: [
              { value: "all", label: "Todos los módulos" },
              ...Object.entries(AUDIT_MODULE_LABELS)
                .filter(([value]) => value !== "EMAILS")
                .map(([value, label]) => ({ value, label })),
            ],
          }}
          onValueChange={(value) => update({ module: value === "all" ? undefined : value, action: undefined })}
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="audit-person" className="text-foreground text-sm font-medium">
            Persona
          </label>
          <AsyncDropdown<AuditPersonOption>
            id="audit-person"
            className="min-w-0"
            clearable
            clearLabel="Limpiar persona"
            defaultOption={{ label: "Todas las personas", value: undefined }}
            fetchPage={(input) => fetchAuditPersonOptions(input, filters)}
            getItemLabel={(person) => person.label}
            getItemDescription={(person) => person.institutionName ?? undefined}
            getItemValue={(person) => person.personId}
            onValueChange={(value) => update({ personId: value })}
            pageSize={20}
            placeholder="Seleccionar persona"
            searchPlaceholder="Buscar persona por nombre…"
            emptyMessage="No se encontraron personas en la auditoría."
            errorMessage="No se pudieron cargar las personas. Intentá nuevamente."
            queryKey={["platform", "audit-people", filters.scope, filters.institutionId]}
            selectedLabel={selectedPersonLabel ?? (filters.personId ? "Persona no disponible" : undefined)}
            value={filters.personId}
          />
        </div>
      </DataTableFilters>
    </Sheet>
  );
}
