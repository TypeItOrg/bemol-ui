import { parseDateInput } from "@common/utils/date-input.util";
import { parsePaginationQuery } from "@common/utils/pagination-query.util";
import { getQueryParamValue, parseUuidQueryParam } from "@common/utils/query-param.util";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_MODULES,
  AUDIT_ACTOR_LABELS,
  AUDIT_MODULE_LABELS,
} from "@features/platform-audit/constants/audit-labels.constants";
import type { AuditActorKind } from "@features/platform-audit/types/audit-actor-kind.types";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditModule } from "@features/platform-audit/types/audit-module.types";
import type { AuditSearchParams } from "@features/platform-audit/types/audit-search-params.types";

export function parseAuditFilters(params: AuditSearchParams): AuditFilters {
  const { page, size } = parsePaginationQuery(params, { defaultSize: 20 });

  const rawScope = getQueryParamValue(params.scope);

  const scope = rawScope === "PLATFORM" || rawScope === "INSTITUTION" ? rawScope : undefined;

  const actorKind = catalogValue(getQueryParamValue(params.actorKind), AUDIT_ACTOR_LABELS) as AuditActorKind | undefined;

  const auditModule = catalogValue(getQueryParamValue(params.module), AUDIT_MODULE_LABELS) as AuditModule | undefined;

  const action = catalogValue(getQueryParamValue(params.action), AUDIT_ACTION_LABELS);

  const from = validDate(getQueryParamValue(params.from));

  const to = validDate(getQueryParamValue(params.to));

  const invalidDate = (params.from && !from) || (params.to && !to);

  let dateError: string | undefined;

  if (invalidDate) {
    dateError = "Ingresá fechas válidas.";
  } else if (from && to && from > to) {
    dateError = "La fecha desde no puede ser posterior a la fecha hasta.";
  }

  return {
    page,
    size,
    scope,
    institutionId: scope !== "PLATFORM" ? parseUuidQueryParam(params.institutionId) : undefined,
    actorKind,
    actorId: actorKind && actorKind !== "ANONYMOUS" ? parseUuidQueryParam(params.actorId) : undefined,
    search: getQueryParamValue(params.search)?.trim().slice(0, 100) || undefined,
    module: auditModule,
    action: action && (!auditModule || AUDIT_ACTION_MODULES[action] === auditModule) ? action : undefined,
    personId: parseUuidQueryParam(params.personId) ?? parseUuidQueryParam(params.subjectPersonId),
    requestId: getQueryParamValue(params.requestId)?.trim().slice(0, 100) || undefined,
    from,
    to,
    dateError,
  };
}

export function buildAuditApiParams(filters: AuditFilters): URLSearchParams {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });

  for (const name of ["scope", "institutionId", "search", "module", "personId", "action", "actorKind", "actorId", "requestId"] as const) {
    const value = filters[name];

    if (value) {
      params.set(name, value);
    }
  }

  if (filters.from) {
    params.set("from", auditDateBoundary(filters.from));
  }

  if (filters.to) {
    params.set("to", auditDateBoundary(filters.to, true));
  }

  return params;
}

export function auditDateBoundary(value: string, nextDay = false): string {
  const date = new Date(`${value}T00:00:00-03:00`);

  if (nextDay) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date.toISOString();
}

function validDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && parseDateInput(value) ? value : undefined;
}

function catalogValue(value: string | undefined, catalog: Readonly<Record<string, string>>): string | undefined {
  return value && Object.hasOwn(catalog, value) ? value : undefined;
}
