import type { PaginationQuery } from "@common/types/pagination-query.types";
import type { Sort } from "@common/utils/sort-query.util";

import type { GuardianLinkStatus } from "@features/guardian-dependents/types/guardian-link-status.types";

export type GuardianLinksQuery = PaginationQuery & {
  sort: Sort<"createdAt" | "status">;
  status?: GuardianLinkStatus;
  hasDocumentation?: boolean;
};
