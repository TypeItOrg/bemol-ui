"use client";

import { useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { Loader2Icon } from "lucide-react";

import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { DataTableSortableHead } from "@common/components/ui/data-table-sortable-head";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import type { PaginatedResponse } from "@common/types/paginated-response.types";

import { PeoplePagination } from "@features/people/components/people-pagination";
import { PeopleTableEmptyState } from "@features/people/components/people-table-empty-state";
import { PeopleTableRow } from "@features/people/components/people-table-row";
import { PersonAccessDialog } from "@features/people/components/person-access-dialog";
import { PersonAccessInvitationDialog } from "@features/people/components/person-access-invitation-dialog";
import { PersonDeleteDialog } from "@features/people/components/person-delete-dialog";
import { PersonStatusDialog } from "@features/people/components/person-status-dialog";
import type { PersonSummary } from "@features/people/types/person-summary.types";
import type { PeoplePaginationParams, PeopleSort, PeopleSortField } from "@features/people/utils/people-pagination.util";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

type PeopleTablePresentationProps = PeoplePaginationParams & {
  data: PaginatedResponse<PersonSummary>;
  institutionId: string;
  scope?: PeopleScopeType;
  selfPersonId?: string | null;
  canCreate?: boolean;
  canUpdate?: boolean;
  canManageRoles?: boolean;
  canDelete?: boolean;
  canUpdateStatus?: boolean;
  canInviteAccess?: boolean;
  canManageAccess?: boolean;
};

export function PeopleTablePresentation({
  data,
  institutionId,
  page,
  size,
  search,
  status,
  roleId,
  sort,
  scope = PeopleScope.ADMIN,
  selfPersonId,
  canCreate = true,
  canUpdate = true,
  canManageRoles = false,
  canDelete = true,
  canUpdateStatus = false,
  canInviteAccess = false,
  canManageAccess = false,
}: PeopleTablePresentationProps): ReactElement {
  const router = useRouter();

  const { isPending: isNavigating, navigate } = useDataTableNavigation();

  const [invitationDialog, setInvitationDialog] = useState<{ person: PersonSummary; cancel: boolean }>();

  const [personToManageAccess, setPersonToManageAccess] = useState<PersonSummary>();

  const [personToDelete, setPersonToDelete] = useState<PersonSummary>();

  const [personToUpdateStatus, setPersonToUpdateStatus] = useState<PersonSummary>();

  function handleDeleteDialogOpenChange(open: boolean): void {
    if (!open) {
      setPersonToDelete(undefined);
    }
  }

  function handlePersonDeleted(): void {
    setPersonToDelete(undefined);
    router.refresh();
  }

  function handleStatusDialogOpenChange(open: boolean): void {
    if (!open) {
      setPersonToUpdateStatus(undefined);
    }
  }

  function handleStatusUpdated(): void {
    setPersonToUpdateStatus(undefined);
    router.refresh();
  }

  function updateSort(nextSort: PeopleSort): void {
    navigate({ page: "0", sortField: nextSort.field, sortDirection: nextSort.direction });
  }

  if (data.items.length === 0) {
    return (
      <PeopleTableEmptyState
        canCreate={canCreate}
        institutionId={institutionId}
        isNavigating={isNavigating}
        scope={scope}
        search={search}
        hasFilters={Boolean(status || roleId)}
        size={size}
        totalItems={data.totalItems}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative h-full overflow-hidden rounded-lg border" aria-busy={isNavigating}>
        <Table stickyActions className="min-w-190">
          <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
            <TableRow className="hover:bg-muted/50 data-[state=selected]:bg-muted h-11 border-b transition-colors">
              <TableHead className="w-16 pl-4">
                <span className="sr-only">Acciones</span>
              </TableHead>
              <DataTableSortableHead<PeopleSortField> field="lastName" label="Nombre" sort={sort} onSortChange={updateSort} />
              <DataTableSortableHead<PeopleSortField>
                field="documentNumber"
                label="Documento Nacional de Identidad"
                sort={sort}
                onSortChange={updateSort}
              />
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo electrónico</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((person) => (
              <PeopleTableRow
                key={person.id}
                canDelete={canDelete}
                canManageRoles={canManageRoles}
                canUpdate={canUpdate}
                canUpdateStatus={canUpdateStatus}
                canInviteAccess={canInviteAccess}
                canManageAccess={canManageAccess}
                onManageAccess={setPersonToManageAccess}
                institutionId={institutionId}
                onInviteAccess={(person) => setInvitationDialog({ person, cancel: false })}
                onCancelInvitation={(person) => setInvitationDialog({ person, cancel: true })}
                onDelete={setPersonToDelete}
                onUpdateStatus={setPersonToUpdateStatus}
                person={person}
                scope={scope}
                selfPersonId={selfPersonId}
              />
            ))}
          </TableBody>
        </Table>

        {isNavigating && (
          <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-label="Cargando usuarios" role="status" />
          </div>
        )}
      </div>

      <PeoplePagination page={page} size={size} totalItems={data.totalItems} totalPages={data.totalPages} />

      {invitationDialog ? (
        <PersonAccessInvitationDialog
          scope={scope}
          institutionId={institutionId}
          {...invitationDialog}
          onClose={() => setInvitationDialog(undefined)}
          onSuccess={() => {
            setInvitationDialog(undefined);
          }}
        />
      ) : null}

      {personToManageAccess ? (
        <PersonAccessDialog
          email={personToManageAccess.email}
          institutionId={institutionId}
          personId={personToManageAccess.id}
          personName={`${personToManageAccess.firstName} ${personToManageAccess.lastName}`}
          scope={scope}
          onClose={() => setPersonToManageAccess(undefined)}
        />
      ) : null}

      {personToDelete ? (
        <PersonDeleteDialog
          institutionId={institutionId}
          scope={scope}
          personId={personToDelete.id}
          personName={`${personToDelete.firstName} ${personToDelete.lastName}`}
          open
          onOpenChange={handleDeleteDialogOpenChange}
          onDeleted={handlePersonDeleted}
        />
      ) : null}

      {personToUpdateStatus ? (
        <PersonStatusDialog
          institutionId={institutionId}
          personId={personToUpdateStatus.id}
          personName={`${personToUpdateStatus.firstName} ${personToUpdateStatus.lastName}`}
          enabled={personToUpdateStatus.enabled}
          open
          onOpenChange={handleStatusDialogOpenChange}
          onUpdated={handleStatusUpdated}
        />
      ) : null}
    </div>
  );
}
