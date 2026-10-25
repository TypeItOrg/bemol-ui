import type { ReactElement } from "react";

import { Badge } from "@common/components/ui/badge";

import {
  CONTEXTUAL_SEARCH_CATEGORY_LABELS,
  CONTEXTUAL_SEARCH_STATUS_LABELS,
  hasPositiveContextualSearchStatus,
} from "@features/contextual-search/config/contextual-search.config";
import type { ContextualSearchResult } from "@features/contextual-search/types/contextual-search-result.types";
import { CONTEXTUAL_SEARCH_SCOPE, type ContextualSearchScope } from "@features/contextual-search/types/contextual-search-scope.types";

export function ContextualSearchResultMetadata({ item, scope }: { item: ContextualSearchResult; scope: ContextualSearchScope }): ReactElement {
  const metadata = [item.subtitle, scope === CONTEXTUAL_SEARCH_SCOPE.PLATFORM ? item.institutionName : null].filter(Boolean).join(" · ");

  const statusLabel = item.status ? (CONTEXTUAL_SEARCH_STATUS_LABELS[item.status] ?? item.status) : null;

  const categoryLabel = item.category ? (CONTEXTUAL_SEARCH_CATEGORY_LABELS[item.category] ?? item.category) : null;

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      {metadata ? <span className="text-muted-foreground truncate text-xs">{metadata}</span> : null}
      <span className="flex min-w-0 flex-wrap items-center gap-1">
        {statusLabel ? <Badge variant={hasPositiveContextualSearchStatus(item.status) ? "success" : "secondary"}>{statusLabel}</Badge> : null}
        {categoryLabel ? <Badge variant="secondary">{categoryLabel}</Badge> : null}
        {item.institutionActive === false ? <Badge variant="secondary">Institución inactiva</Badge> : null}
      </span>
    </span>
  );
}
