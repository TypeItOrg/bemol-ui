import type { ReactElement } from "react";

import { AuditEventsTable } from "@features/platform-audit/components/audit-events-table";
import { fetchAuditEvents } from "@features/platform-audit/services/fetch-audit-events.service";
import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";

export async function AuditEventsTableContainer({ filters }: { filters: AuditFilters }): Promise<ReactElement> {
  let data = await fetchAuditEvents(filters);

  if (filters.page > 0 && filters.page >= data.totalPages) {
    data = await fetchAuditEvents({ ...filters, page: Math.max(0, data.totalPages - 1) });
  }

  const mailView = filters.module === "EMAILS";

  const hasFilters = Object.entries(filters).some(
    ([key, value]) => !["page", "size", "dateError"].includes(key) && !(mailView && key === "module") && value !== undefined,
  );

  return <AuditEventsTable data={data} hasFilters={hasFilters} mailView={mailView} />;
}
