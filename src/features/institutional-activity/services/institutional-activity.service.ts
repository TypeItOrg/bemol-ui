import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse, parseNullableHttpResponse } from "@common/utils/http-response-error.util";

import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import type { AuditActionOption } from "@features/platform-audit/types/audit-action-option.types";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditModuleOption } from "@features/platform-audit/types/audit-module-option.types";
import { buildAuditApiParams } from "@features/platform-audit/utils/audit-query.util";

export async function fetchInstitutionalActivity(institutionId: string, filters: AuditFilters): Promise<PaginatedResponse<AuditEvent>> {
  const resource = filters.module === "EMAILS" ? "emails" : "audit-events";

  const response = await institutionalApiFetch(`/api/v1/institutions/${institutionId}/activity/${resource}?${buildAuditApiParams(filters)}`);

  return parseHttpResponse(response, "No se pudo cargar la actividad institucional.");
}

export async function fetchInstitutionalActivityEvent(institutionId: string, eventId: string, mailView: boolean): Promise<AuditEvent | null> {
  const resource = mailView ? "emails" : "audit-events";

  const response = await institutionalApiFetch(`/api/v1/institutions/${institutionId}/activity/${resource}/${eventId}`);

  return parseNullableHttpResponse(response, "No se pudo cargar el evento.");
}

export async function fetchInstitutionalAuditModules(institutionId: string): Promise<AuditModuleOption[]> {
  const response = await institutionalApiFetch(`/api/v1/institutions/${institutionId}/activity/audit-events/modules`);

  return parseHttpResponse(response, "No se pudieron cargar los módulos de auditoría.");
}

export async function fetchSelectedInstitutionalAuditAction(institutionId: string, action?: string): Promise<AuditActionOption | undefined> {
  if (!action) {
    return undefined;
  }

  const params = new URLSearchParams({ page: "0", size: "1", action });

  const response = await institutionalApiFetch(`/api/v1/institutions/${institutionId}/activity/audit-events/actions?${params}`);

  const data = await parseHttpResponse<PaginatedResponse<AuditActionOption>>(response, "No se pudo cargar la acción seleccionada.");

  return data.items[0];
}
