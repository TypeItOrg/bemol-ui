import type { AuditFilters } from "@features/platform-audit/types/audit-filters.types";
import type { AuditSearchParams } from "@features/platform-audit/types/audit-search-params.types";
import { parseAuditFilters, parseMailFilters } from "@features/platform-audit/utils/audit-query.util";

export function parseInstitutionalActivityFilters(params: AuditSearchParams, mailView: boolean): AuditFilters {
  const filters = mailView ? parseMailFilters(params) : parseAuditFilters(params);

  return {
    page: filters.page,
    size: filters.size,
    search: filters.search,
    module: filters.module,
    action: filters.action,
    mailType: filters.mailType,
    from: filters.from,
    to: filters.to,
    dateError: filters.dateError,
  };
}
