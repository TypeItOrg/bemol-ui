import "server-only";

import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parseHttpResponse, parseNullableHttpResponse } from "@common/utils/http-response-error.util";

import type { ActivityLabels } from "@features/institutional-activity/types/activity-labels.types";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
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

export async function fetchInstitutionalActivityLabels(institutionId: string): Promise<ActivityLabels> {
  const response = await institutionalApiFetch(`/api/v1/institutions/${institutionId}/activity/audit-events/labels`);

  return parseHttpResponse(response, "No se pudieron cargar las descripciones de los permisos.");
}
