"use client";

import type { ReactElement, ReactNode } from "react";

import { Loader2Icon, PlusIcon, SearchIcon, UserIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Button } from "@common/components/ui/button";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { EmptyMedia } from "@common/components/ui/empty";
import { DATA_TABLE_EMPTY_MESSAGES } from "@common/constants/data-table-empty.constants";
import type { PaginationQuery } from "@common/types/pagination-query.types";

import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

type PeopleTableEmptyStateProps = Pick<PaginationQuery, "search" | "size"> & {
  canCreate: boolean;
  hasFilters?: boolean;
  institutionId: string;
  isNavigating: boolean;
  scope: PeopleScopeType;
  totalItems: number;
};

export function PeopleTableEmptyState({
  canCreate,
  hasFilters = false,
  institutionId,
  isNavigating,
  scope,
  search,
  totalItems,
}: PeopleTableEmptyStateProps): ReactElement {
  const { navigate } = useDataTableNavigation();

  let content: ReactNode;

  if (totalItems > 0) {
    content = (
      <div className="bg-muted/25 text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border px-4 py-12 text-center">
        <EmptyMedia className="mb-4" variant="icon">
          <UserIcon className="size-5" />
        </EmptyMedia>
        <h3 className="text-foreground text-base font-semibold">No hay usuarios en esta página</h3>
        <p className="text-muted-foreground mt-1.5 mb-6 max-w-sm text-sm">
          La página seleccionada no contiene elementos. Podés volver a la primera página para ver los resultados.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate({ page: "0" })}>
          Volver a la primera página
        </Button>
      </div>
    );
  } else if (search.trim() !== "" || hasFilters) {
    content = (
      <div className="bg-muted/25 text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border px-4 py-12 text-center">
        <EmptyMedia className="mb-4" variant="icon">
          <SearchIcon className="size-5" />
        </EmptyMedia>
        <h3 className="text-foreground text-base font-semibold">No se encontraron usuarios</h3>
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{DATA_TABLE_EMPTY_MESSAGES.FILTERED_DESCRIPTION}</p>
      </div>
    );
  } else {
    content = (
      <div className="bg-muted/25 text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border px-4 py-12 text-center">
        <EmptyMedia className="mb-4" variant="icon">
          <UserIcon className="size-5" />
        </EmptyMedia>
        <h3 className="text-foreground text-base font-semibold">No hay usuarios registrados</h3>
        <p className={`text-muted-foreground mt-1.5 max-w-sm text-sm ${canCreate ? "mb-6" : ""}`}>
          {canCreate ? "Comenzá creando un nuevo usuario para esta institución." : "Todavía no hay usuarios registrados en esta institución."}
        </p>
        {canCreate ? (
          <Button asChild size="lg">
            <ReturnToLink href={PeopleScope.isInstitutional(scope) ? "/people/new" : `/institutions/${institutionId}/people/new`}>
              <PlusIcon className="mr-2 size-4" />
              Nuevo usuario
            </ReturnToLink>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative h-full" aria-busy={isNavigating}>
      {content}
      {isNavigating ? (
        <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-label="Cargando usuarios" role="status" />
        </div>
      ) : null}
    </div>
  );
}
