"use client";

import { startTransition, useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { Loader2Icon, PlusIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Button } from "@common/components/ui/button";
import { DataTableAdvancedFiltersTrigger } from "@common/components/ui/data-table-advanced-filters-trigger";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { DataTablePagination } from "@common/components/ui/data-table-pagination";
import { DataTableSortableHead } from "@common/components/ui/data-table-sortable-head";
import { Sheet } from "@common/components/ui/sheet";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { PAGE_SIZE_OPTIONS } from "@common/utils/pagination-query.util";

import { GuardianDependentRow } from "@features/guardian-dependents/components/guardian-dependent-row";
import { GuardianDependentsEmptyState } from "@features/guardian-dependents/components/guardian-dependents-empty-state";
import { GuardianDependentsFilters } from "@features/guardian-dependents/components/guardian-dependents-filters";
import { OwnAccessDialog } from "@features/guardian-dependents/components/own-access-dialog";
import { UnlinkGuardianDependentDialog } from "@features/guardian-dependents/components/unlink-guardian-dependent-dialog";
import type { GuardianDependent } from "@features/guardian-dependents/types/guardian-dependent.types";
import type { GuardianDependentsQuery } from "@features/guardian-dependents/types/guardian-dependents-query.types";
import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";
import { useActiveIdentitySwitch } from "@features/guardian-workspace/hooks/use-active-identity-switch";
import { PlatformCollectionActions } from "@features/platform-auth/components/platform-collection-actions";

type GuardianDependentsListProps = {
  data: PaginatedResponse<GuardianDependent>;
  institutionId: string;
  query: GuardianDependentsQuery;
};

export function GuardianDependentsList({ data, institutionId, query }: GuardianDependentsListProps): ReactElement {
  const router = useRouter();

  const { isPending: isNavigating, navigate } = useDataTableNavigation();

  const [personForAccess, setPersonForAccess] = useState<GuardianDependent | null>(null);

  const [dependentToUnlink, setDependentToUnlink] = useState<GuardianDependent | null>(null);

  const { state: identityState, action: selectIdentity, pending: isSelectingWorkspace } = useActiveIdentitySwitch();

  const isFiltered = Boolean(query.search || query.status || query.relationship || query.primaryContact !== undefined);

  function handleEnrollment(dependentPersonId: string): void {
    const formData = new FormData();

    formData.set("personId", dependentPersonId);
    formData.set("returnTo", `/self-service/${dependentPersonId}/enrollment`);
    startTransition(() => selectIdentity(formData));
  }

  return (
    <Sheet>
      {personForAccess ? (
        <OwnAccessDialog
          institutionId={institutionId}
          person={personForAccess}
          onClose={() => setPersonForAccess(null)}
          onSuccess={() => {
            setPersonForAccess(null);
          }}
        />
      ) : null}
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PlatformCollectionActions className="sm:justify-between">
          <Button asChild size="lg">
            <ReturnToLink href="/my-dependents/new">
              <PlusIcon aria-hidden="true" />
              Solicitar vinculación
            </ReturnToLink>
          </Button>
          <DataTableAdvancedFiltersTrigger count={query.primaryContact === undefined ? 0 : 1} label="Filtros avanzados" />
        </PlatformCollectionActions>

        <GuardianDependentsFilters query={query} />
        {identityState.error ? (
          <p role="alert" className="text-destructive text-sm">
            {identityState.error}
          </p>
        ) : null}

        <div
          className={data.items.length === 0 ? "relative h-full" : "relative min-h-0 flex-1 overflow-hidden rounded-lg border"}
          aria-busy={isNavigating}
        >
          {data.items.length === 0 ? (
            <GuardianDependentsEmptyState hasFilters={isFiltered} />
          ) : (
            <Table className="min-w-250">
              <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
                <TableRow className="hover:bg-muted/50 h-11">
                  <TableHead className="w-16 pl-4">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                  {(
                    [
                      ["firstName", "Nombre"],
                      ["lastName", "Apellido"],
                      ["documentNumber", "Documento Nacional de Identidad"],
                    ] as const
                  ).map(([field, label]) => (
                    <DataTableSortableHead
                      key={field}
                      field={field}
                      label={label}
                      sort={query.sort}
                      onSortChange={(sort) => navigate({ page: "0", sortField: sort.field, sortDirection: sort.direction })}
                    />
                  ))}
                  <TableHead>Edad</TableHead>
                  <DataTableSortableHead
                    field="relationship"
                    label="Tu vínculo"
                    sort={query.sort}
                    onSortChange={(sort) => navigate({ page: "0", sortField: sort.field, sortDirection: sort.direction })}
                  />
                  <TableHead>Contacto principal</TableHead>
                  <DataTableSortableHead
                    field="status"
                    label="Estado"
                    sort={query.sort}
                    onSortChange={(sort) => navigate({ page: "0", sortField: sort.field, sortDirection: sort.direction })}
                  />
                  <TableHead>Acceso propio</TableHead>
                  <TableHead>Inscripciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((dependent) => (
                  <GuardianDependentRow
                    key={dependent.personGuardianId}
                    dependent={dependent}
                    isSelectingWorkspace={isSelectingWorkspace}
                    onEnroll={() => handleEnrollment(dependent.dependentPersonId)}
                    onManageAccess={() => setPersonForAccess(dependent)}
                    onUnlink={() => setDependentToUnlink(dependent)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
          {isNavigating ? (
            <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-label="Cargando personas a cargo" role="status" />
            </div>
          ) : null}
        </div>

        {data.items.length > 0 ? (
          <DataTablePagination
            page={data.page}
            size={data.size}
            totalPages={data.totalPages}
            summaryLabel={`${data.totalItems} ${data.totalItems === 1 ? "persona a cargo." : "personas a cargo."}`}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isPending={isNavigating}
            onPageChange={(page) => navigate({ page: String(page), size: String(query.size) })}
            onPageSizeChange={(size) => navigate({ page: "0", size })}
          />
        ) : null}

        {dependentToUnlink ? (
          <UnlinkGuardianDependentDialog
            dependentName={getGuardianDependentName(dependentToUnlink)}
            isPendingRequest={dependentToUnlink.status === "PENDING"}
            dependentPersonId={dependentToUnlink.dependentPersonId}
            institutionId={institutionId}
            onClose={() => setDependentToUnlink(null)}
            onSuccess={() => {
              setDependentToUnlink(null);
              router.refresh();
            }}
          />
        ) : null}
      </div>
    </Sheet>
  );
}
