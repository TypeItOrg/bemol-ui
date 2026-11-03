import type { DataTableSelectFilter } from "@common/types/data-table-select-filter.types";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getQueryParamValue } from "@common/utils/query-param.util";

import type { PersonSummary } from "@features/people/types/person-summary.types";

const PERSON_STATUS_LABELS = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  INVITATION_PENDING: "Invitación pendiente",
  NO_ACCOUNT: "Sin cuenta",
} as const;

export type PersonStatus = keyof typeof PERSON_STATUS_LABELS;

export function parsePersonStatus(value: QueryParamValue): PersonStatus | undefined {
  const status = getQueryParamValue(value);

  return status && Object.hasOwn(PERSON_STATUS_LABELS, status) ? (status as PersonStatus) : undefined;
}

export function getPersonStatusLabel(person: Pick<PersonSummary, "enabled" | "hasAccount" | "accessInvitationPending">): string {
  if (!person.hasAccount) {
    return PERSON_STATUS_LABELS[person.accessInvitationPending ? "INVITATION_PENDING" : "NO_ACCOUNT"];
  }

  return PERSON_STATUS_LABELS[person.enabled ? "ACTIVE" : "INACTIVE"];
}

export function getPersonStatusFilter(status: PersonStatus | undefined): DataTableSelectFilter {
  return {
    defaultValue: "all",
    label: "Estado",
    name: "status",
    options: [{ value: "all", label: "Todos los estados" }, ...Object.entries(PERSON_STATUS_LABELS).map(([value, label]) => ({ value, label }))],
    value: status ?? "all",
  };
}
