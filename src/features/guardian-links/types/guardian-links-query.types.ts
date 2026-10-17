import type { PaginationQuery } from "@common/types/pagination-query.types";

import type { GuardianLinkStatus } from "@features/guardian-dependents/types/guardian-link-status.types";

export type GuardianLinksQuery = PaginationQuery & {
  status?: GuardianLinkStatus;
  hasDocumentation?: boolean;
};
