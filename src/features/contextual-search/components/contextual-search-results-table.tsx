import type { ReactElement } from "react";

import Link from "next/link";

import { BuildingIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { Badge } from "@common/components/ui/badge";
import { DataTableIconLabel } from "@common/components/ui/data-table-icon-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";

import {
  CONTEXTUAL_SEARCH_PRESENTATION,
  CONTEXTUAL_SEARCH_STATUS_LABELS,
  hasPositiveContextualSearchStatus,
} from "@features/contextual-search/config/contextual-search.config";
import type { AcademicContextualSearchEntity } from "@features/contextual-search/types/academic-contextual-search-entity.types";
import type { ContextualSearchResult } from "@features/contextual-search/types/contextual-search-result.types";
import { getContextualSearchLabels } from "@features/contextual-search/utils/contextual-search-label.util";
import { getContextualSearchResultHref } from "@features/contextual-search/utils/contextual-search-route.util";

type ContextualSearchResultsTableProps = {
  entityType: AcademicContextualSearchEntity;
  items: ContextualSearchResult[];
};

export function ContextualSearchResultsTable({ entityType, items }: ContextualSearchResultsTableProps): ReactElement {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed px-5 py-12 text-center text-sm">
        No hay resultados para esta búsqueda.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resultado</TableHead>
          <TableHead>Institución</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const labels = getContextualSearchLabels(entityType, item);

          const resultHref = getContextualSearchResultHref("platform", entityType, item);

          const ResultIcon = CONTEXTUAL_SEARCH_PRESENTATION[entityType].icon;

          return (
            <TableRow key={item.id}>
              <TableCell>
                <DataTableIconLabel icon={ResultIcon}>
                  <div>
                    <Link href={resultHref} className="font-medium hover:underline">
                      {labels.title}
                    </Link>
                    {labels.subtitle ? <span className="text-muted-foreground mt-0.5 block text-xs">{labels.subtitle}</span> : null}
                  </div>
                </DataTableIconLabel>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <DataTableIconLabel icon={BuildingIcon}>{item.institutionName ?? "Plataforma"}</DataTableIconLabel>
              </TableCell>
              <TableCell>
                {item.status ? (
                  <Badge variant={hasPositiveContextualSearchStatus(item.status) ? "success" : "secondary"}>
                    {CONTEXTUAL_SEARCH_STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                ) : (
                  <OptionalValue value={null} fallback="Sin estado informado" />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
