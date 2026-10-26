"use client";

import type { ReactElement } from "react";

import { DataTableAdvancedFiltersTrigger } from "@common/components/ui/data-table-advanced-filters-trigger";
import { DataTableFilterSelect } from "@common/components/ui/data-table-filter-select";
import { DataTableFilters } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { Sheet } from "@common/components/ui/sheet";
import { countActiveAdvancedFilters } from "@common/utils/count-active-advanced-filters.util";

import { AUDIT_ACTION_LABELS, AUDIT_ACTION_MODULES, AUDIT_MODULE_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import { MAIL_RESULT_LABELS, MAIL_TYPE_LABELS } from "@features/platform-audit/constants/mail-labels.constants";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import { PlatformCollectionActions } from "@features/platform-auth/components/platform-collection-actions";

export function InstitutionalActivityFilters({ filters }: { filters: AuditFilters }): ReactElement {
  const { navigate } = useDataTableNavigation();

  const mailView = filters.module === "EMAILS";

  const advancedDateFilters = [
    { name: "from", label: "Desde", value: filters.from },
    { name: "to", label: "Hasta", value: filters.to },
  ];

  const modules = Object.fromEntries(Object.entries(AUDIT_MODULE_LABELS).filter(([module]) => module !== "EMAILS"));

  const actions = mailView
    ? MAIL_RESULT_LABELS
    : Object.fromEntries(
        Object.entries(AUDIT_ACTION_LABELS).filter(
          ([action]) =>
            AUDIT_ACTION_MODULES[action] !== "EMAILS" &&
            !action.startsWith("PLATFORM_ACCOUNT_") &&
            (!filters.module || AUDIT_ACTION_MODULES[action] === filters.module),
        ),
      );

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
              ...Object.entries(mailView ? MAIL_TYPE_LABELS : modules).map(([value, label]) => ({ value, label })),
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
        <DataTableFilterSelect
          filter={{
            name: "action",
            label: mailView ? "Resultado" : "Acción",
            defaultValue: "all",
            value: filters.action ?? "all",
            options: [
              { value: "all", label: mailView ? "Todos los resultados" : "Todas las acciones" },
              ...Object.entries(actions).map(([value, label]) => ({ value, label })),
            ],
          }}
          onValueChange={(value) => update({ action: value === "all" ? undefined : value })}
        />
      </DataTableFilters>
    </Sheet>
  );
}
