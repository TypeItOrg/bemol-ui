"use client";

import type { ReactElement } from "react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";

import { fetchPlatformInstitutionOptions } from "@features/institutions/services/fetch-platform-institution-options.service";
import type { InstitutionSummary } from "@features/institutions/types/institution-summary.types";

export function AuditInstitutionFilter({
  value,
  selectedLabel,
  onValueChange,
}: {
  value?: string;
  selectedLabel?: string;
  onValueChange: (value: string | undefined) => void;
}): ReactElement {
  return (
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
        onValueChange={onValueChange}
        pageSize={20}
        placeholder="Seleccionar institución"
        queryKey={["platform", "audit-institutions"]}
        searchPlaceholder="Buscar institución…"
        selectedLabel={selectedLabel ?? (value ? "Institución no disponible" : undefined)}
        value={value}
      />
    </div>
  );
}
