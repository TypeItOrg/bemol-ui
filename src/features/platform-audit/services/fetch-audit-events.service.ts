import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse, parseNullableHttpResponse } from "@common/utils/http-response-error.util";

import type { AuditActionOption } from "@features/platform-audit/types/audit-action-option.types";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditModuleOption } from "@features/platform-audit/types/audit-module-option.types";
import type { AuditPersonOption } from "@features/platform-audit/types/audit-person-option.types";
import { buildAuditApiParams } from "@features/platform-audit/utils/audit-query.util";
import { platformApiFetch } from "@features/platform-auth/services/platform-api-fetch.service";

export async function fetchAuditEvents(filters: AuditFilters): Promise<PaginatedResponse<AuditEvent>> {
  const response = await platformApiFetch(`/api/v1/admin/audit-events?${buildAuditApiParams(filters)}`);

  return parseHttpResponse(response, filters.module === "EMAILS" ? "No se pudieron cargar los correos." : "No se pudo cargar la auditoría.");
}

export async function fetchAuditEvent(id: string): Promise<AuditEvent | null> {
  const response = await platformApiFetch(`/api/v1/admin/audit-events/${id}`);

  return parseNullableHttpResponse(response, "No se pudo cargar el evento.");
}

export async function fetchSelectedAuditPerson(filters: AuditFilters): Promise<AuditPersonOption | undefined> {
  if (!filters.personId) {
    return undefined;
  }

  const params = new URLSearchParams({ page: "0", size: "1", personId: filters.personId });

  const response = await platformApiFetch(`/api/v1/admin/audit-events/people?${params}`);

  const data = await parseHttpResponse<PaginatedResponse<AuditPersonOption>>(response, "No se pudo cargar la persona seleccionada.");

  return data.items[0];
}

export async function fetchAuditModules(): Promise<AuditModuleOption[]> {
  const response = await platformApiFetch("/api/v1/admin/audit-events/modules");

  return parseHttpResponse(response, "No se pudieron cargar los módulos de auditoría.");
}

export async function fetchSelectedAuditAction(filters: AuditFilters): Promise<AuditActionOption | undefined> {
  if (!filters.action) {
    return undefined;
  }

  const params = new URLSearchParams({ page: "0", size: "1", action: filters.action });

  const response = await platformApiFetch(`/api/v1/admin/audit-events/actions?${params}`);

  const data = await parseHttpResponse<PaginatedResponse<AuditActionOption>>(response, "No se pudo cargar la acción seleccionada.");

  return data.items[0];
}
