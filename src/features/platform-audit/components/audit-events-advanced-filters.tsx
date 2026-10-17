"use client";

import type { ReactElement } from "react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { DataTableFilterSelect } from "@common/components/ui/data-table-filter-select";

import { fetchPlatformInstitutionOptions } from "@features/institutions/services/fetch-platform-institution-options.service";
import type { InstitutionSummary } from "@features/institutions/types/institution-summary.types";
import { AuditIdentifierFilter } from "@features/platform-audit/components/audit-identifier-filter";
import { AUDIT_ACTION_LABELS, AUDIT_ACTOR_LABELS, AUDIT_MODULE_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import { fetchAuditActionOptions } from "@features/platform-audit/services/fetch-audit-actions.service";
import { fetchAuditActorOptions } from "@features/platform-audit/services/fetch-audit-actors.service";
import type { AuditActionOption } from "@features/platform-audit/types/audit-action-option.types";
import type { AuditActorOption } from "@features/platform-audit/types/audit-actor-option.types";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";

export function AuditEventsAdvancedFilters({
  filters,
  institutionName,
  selectedActorLabel,
  onChange,
}: {
  filters: AuditFilters;
  institutionName?: string;
  selectedActorLabel?: string;
  onChange: (values: Record<string, string | undefined>) => void;
}): ReactElement {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="audit-institution" className="text-foreground text-sm font-medium">
          Institución
        </label>
        <AsyncDropdown<InstitutionSummary>
          id="audit-institution"
          className="min-w-0"
          clearable
          clearLabel="Limpiar institución"
          defaultOption={{ label: "Todas las instituciones", value: undefined }}
          fetchPage={fetchPlatformInstitutionOptions}
          getItemLabel={(institution) => institution.name}
          getItemValue={(institution) => institution.id}
          onValueChange={(value) => onChange({ institutionId: value, scope: value && filters.scope === "PLATFORM" ? undefined : filters.scope })}
          pageSize={20}
          placeholder="Seleccionar institución"
          queryKey={["platform", "audit-institutions"]}
          searchPlaceholder="Buscar institución…"
          selectedLabel={institutionName ?? (filters.institutionId ? "Institución no disponible" : undefined)}
          value={filters.institutionId}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="audit-action" className="text-foreground text-sm font-medium">
          Acción
        </label>
        <AsyncDropdown<AuditActionOption>
          id="audit-action"
          className="min-w-0"
          clearable
          clearLabel="Limpiar acción"
          defaultOption={{ label: "Todas las acciones", value: undefined }}
          fetchPage={(input) => fetchAuditActionOptions(input, filters.module)}
          getItemLabel={(action) => action.label}
          getItemGroup={filters.module ? undefined : (action) => AUDIT_MODULE_LABELS[action.module]}
          groupOrder={Object.values(AUDIT_MODULE_LABELS)}
          getItemValue={(action) => action.action}
          onValueChange={(value) => onChange({ action: value })}
          pageSize={20}
          placeholder="Seleccionar acción"
          searchPlaceholder="Buscar acción…"
          emptyMessage="No se encontraron acciones."
          errorMessage="No se pudieron cargar las acciones. Intentá nuevamente."
          queryKey={["platform", "audit-actions", filters.module]}
          selectedLabel={filters.action ? AUDIT_ACTION_LABELS[filters.action] : undefined}
          value={filters.action}
        />
      </div>
      <DataTableFilterSelect
        filter={{
          name: "actorKind",
          label: "Tipo de actor",
          defaultValue: "all",
          value: filters.actorKind ?? "all",
          options: [{ value: "all", label: "Todos los tipos" }, ...Object.entries(AUDIT_ACTOR_LABELS).map(([value, label]) => ({ value, label }))],
        }}
        onValueChange={(value) => onChange({ actorKind: value === "all" ? undefined : value, actorId: undefined })}
      />
      {filters.actorKind !== "ANONYMOUS" ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="audit-actor" className="text-foreground text-sm font-medium">
            Realizado por
          </label>
          <AsyncDropdown<AuditActorOption>
            id="audit-actor"
            className="min-w-0"
            clearable
            clearLabel="Limpiar quién lo realizó"
            defaultOption={{ label: "Cualquier actor", value: undefined }}
            fetchPage={(input) => fetchAuditActorOptions(input, filters.actorKind, filters.institutionId)}
            getItemLabel={(actor) => actor.label}
            getItemDescription={(actor) => AUDIT_ACTOR_LABELS[actor.actorKind]}
            getItemValue={(actor) => `${actor.actorKind}:${actor.actorId}`}
            onValueChange={(_, actor) => onChange({ actorKind: actor?.actorKind ?? filters.actorKind, actorId: actor?.actorId })}
            pageSize={20}
            placeholder="Seleccionar actor"
            searchPlaceholder="Buscar actor por nombre…"
            emptyMessage="No se encontraron actores en la auditoría."
            errorMessage="No se pudieron cargar los actores. Intentá nuevamente."
            queryKey={["platform", "audit-actors", filters.scope, filters.actorKind, filters.institutionId]}
            selectedLabel={selectedActorLabel}
            value={filters.actorId ? `${filters.actorKind}:${filters.actorId}` : undefined}
          />
        </div>
      ) : null}
      <DataTableFilterSelect
        filter={{
          name: "scope",
          label: "Ámbito",
          defaultValue: "all",
          value: filters.scope ?? "all",
          options: [
            { value: "all", label: "Todos los ámbitos" },
            { value: "PLATFORM", label: "Solo plataforma" },
            { value: "INSTITUTION", label: "Institucional" },
          ],
        }}
        onValueChange={(value) =>
          onChange({ scope: value === "all" ? undefined : value, institutionId: value === "PLATFORM" ? undefined : filters.institutionId })
        }
      />
      <AuditIdentifierFilter
        key={`request-${filters.requestId}`}
        label="Identificador de la petición"
        value={filters.requestId}
        onCommit={(value) => onChange({ requestId: value })}
      />
    </div>
  );
}
