"use client";

/* eslint-disable max-lines */

import { useState, type ReactElement } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EllipsisVerticalIcon, Loader2Icon, SearchIcon, UsersIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DataTableFilters } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { DataTablePagination } from "@common/components/ui/data-table-pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { PAGE_SIZE_OPTIONS } from "@common/utils/pagination-query.util";
import { appendReturnTo } from "@common/utils/return-to.util";

import { formatEnrollmentApplicationDateTime } from "@features/enrollment-applications/utils/enrollment-application-date.util";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import { GUARDIAN_LINK_STATUS, type GuardianLinkStatus } from "@features/guardian-dependents/types/guardian-link-status.types";
import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";
import { resolveGuardianLinkAction } from "@features/guardian-links/actions/resolve-guardian-link.action";
import { ApproveGuardianLinkDialog } from "@features/guardian-links/components/approve-guardian-link-dialog";
import { PersonCell, RequestStatus } from "@features/guardian-links/components/guardian-link-display";
import { RejectGuardianLinkDialog } from "@features/guardian-links/components/reject-guardian-link-dialog";
import type { GuardianLinkDecision } from "@features/guardian-links/types/guardian-link-decision.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";
import type { GuardianLinksQuery } from "@features/guardian-links/types/guardian-links-query.types";

type GuardianLinkRequestsProps = {
  data: PaginatedResponse<GuardianLinkRequest>;
  query: GuardianLinksQuery;
  institutionId?: string;
  onResolve?: (institutionId: string, linkId: string, decision: GuardianLinkDecision) => Promise<{ error?: string }>;
  showInstitution?: boolean;
};
type StatusFilter = "ALL" | GuardianLinkStatus;

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "Todos los estados",
  PENDING: "Pendiente",
  ACTIVE: "Aceptada",
  REJECTED: "Rechazada",
  ENDED: "Finalizada",
};

export function GuardianLinkRequests({
  data,
  query,
  institutionId,
  onResolve = resolveGuardianLinkAction,
  showInstitution = false,
}: GuardianLinkRequestsProps): ReactElement {
  const router = useRouter();

  const { isPending: isNavigating, navigate } = useDataTableNavigation();

  const [requestToApprove, setRequestToApprove] = useState<GuardianLinkRequest | null>(null);

  const [requestToReject, setRequestToReject] = useState<GuardianLinkRequest | null>(null);

  const pathname = usePathname();

  const searchParams = useSearchParams();

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <GuardianLinkFilters query={query} />

      <div
        className={data.items.length === 0 ? "relative flex min-h-0 flex-1 flex-col" : "relative min-h-0 flex-1 overflow-hidden rounded-lg border"}
        aria-busy={isNavigating}
      >
        {data.items.length === 0 ? (
          <EmptyRequests hasFilters={Boolean(query.search || query.status || query.hasDocumentation !== undefined)} />
        ) : (
          <Table stickyActions containerClassName="table-scrollbar" className="min-w-240">
            <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
              <TableRow className="hover:bg-muted/50 h-11">
                <TableHead className="w-16 pl-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
                {showInstitution ? <TableHead>Institución</TableHead> : null}
                <TableHead>Representante</TableHead>
                <TableHead>Persona representada</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Fecha de solicitud</TableHead>
                <TableHead>Documentación</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((request) => (
                <RequestRow
                  key={request.personGuardianId}
                  onView={() => router.push(appendReturnTo(`${pathname}/${request.personGuardianId}`, `${pathname}?${searchParams.toString()}`))}
                  onApprove={() => setRequestToApprove(request)}
                  onReject={() => setRequestToReject(request)}
                  request={request}
                  showInstitution={showInstitution}
                />
              ))}
            </TableBody>
          </Table>
        )}
        {isNavigating ? (
          <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-label="Cargando vinculaciones" role="status" />
          </div>
        ) : null}
      </div>

      {data.items.length > 0 ? (
        <DataTablePagination
          page={data.page}
          size={data.size}
          totalPages={data.totalPages}
          summaryLabel={`${data.totalItems} ${data.totalItems === 1 ? "vinculación." : "vinculaciones."}`}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          isPending={isNavigating}
          onPageChange={(page) => navigate({ page: String(page), size: String(query.size) })}
          onPageSizeChange={(size) => navigate({ page: "0", size })}
        />
      ) : null}

      {requestToApprove ? (
        <ApproveGuardianLinkDialog
          institutionId={institutionId}
          onApproved={() => {
            setRequestToApprove(null);
            router.refresh();
          }}
          onClose={() => setRequestToApprove(null)}
          onResolve={onResolve}
          request={requestToApprove}
        />
      ) : null}

      {requestToReject ? (
        <RejectGuardianLinkDialog
          institutionId={institutionId}
          onClose={() => setRequestToReject(null)}
          onRejected={() => {
            setRequestToReject(null);
            router.refresh();
          }}
          onResolve={onResolve}
          request={requestToReject}
        />
      ) : null}
    </div>
  );
}

function GuardianLinkFilters({ query }: { query: GuardianLinksQuery }): ReactElement {
  return (
    <DataTableFilters
      search={query.search}
      searchPlaceholder="Buscar por nombre, apellido o documento..."
      size={query.size}
      selectFilters={[
        {
          defaultValue: "ALL",
          label: "Estado",
          name: "status",
          options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
          value: query.status ?? "ALL",
        },
        {
          defaultValue: "ALL",
          label: "Documentación",
          name: "hasDocumentation",
          options: [
            { value: "ALL", label: "Toda la documentación" },
            { value: "true", label: "Con documentación" },
            { value: "false", label: "Sin documentación" },
          ],
          value: query.hasDocumentation === undefined ? "ALL" : String(query.hasDocumentation),
        },
      ]}
    />
  );
}

function RequestRow({
  request,
  onApprove,
  onReject,
  onView,
  showInstitution,
}: {
  request: GuardianLinkRequest;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  showInstitution: boolean;
}): ReactElement {
  const isPendingStatus = request.status === GUARDIAN_LINK_STATUS.PENDING;

  const dependentName = getGuardianDependentName(request.dependent) || "esta solicitud";

  const tableRow = (
    <TableRow className="h-12">
      <TableCell className="w-16 pl-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label={`Abrir acciones de ${dependentName}`} size="icon" type="button" variant="ghost">
              <EllipsisVerticalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 p-1.5">
            <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onView}>
              Ver detalle
            </DropdownMenuItem>
            {isPendingStatus ? (
              <>
                <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onApprove}>
                  Aceptar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="px-2.5 py-1.5" onSelect={onReject} variant="destructive">
                  Rechazar
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      {showInstitution ? (
        <TableCell>
          <OptionalValue value={request.institution?.name} fallback="Sin institución" />
        </TableCell>
      ) : null}
      <TableCell>
        <PersonCell person={request.tutor} />
      </TableCell>
      <TableCell>
        <PersonCell person={request.dependent} />
      </TableCell>
      <TableCell>{GUARDIAN_RELATIONSHIP_LABELS[request.relationship]}</TableCell>
      <TableCell>{formatEnrollmentApplicationDateTime(request.createdAt)}</TableCell>
      <TableCell>
        <OptionalValue
          value={
            request.attachments.length > 0 ? (
              <p>
                {request.attachments.length} {request.attachments.length === 1 ? "documento" : "documentos"}
              </p>
            ) : null
          }
          fallback="Sin documentación"
        />
      </TableCell>
      <TableCell>
        <RequestStatus status={request.status} />
      </TableCell>
    </TableRow>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{tableRow}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 p-1.5">
        <ContextMenuItem className="px-2.5 py-1.5" onSelect={onView}>
          Ver detalle
        </ContextMenuItem>
        {isPendingStatus ? (
          <>
            <ContextMenuItem className="px-2.5 py-1.5" onSelect={onApprove}>
              Aceptar
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="px-2.5 py-1.5" onSelect={onReject} variant="destructive">
              Rechazar
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function EmptyRequests({ hasFilters }: { hasFilters: boolean }): ReactElement {
  const Icon = hasFilters ? SearchIcon : UsersIcon;

  return (
    <Empty className="bg-muted/25 min-h-80 rounded-lg border border-solid px-4 py-12">
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="mt-2 text-base">{hasFilters ? "No se encontraron solicitudes" : "No hay solicitudes de vinculación"}</EmptyTitle>
        <EmptyDescription>
          {hasFilters
            ? "No encontramos solicitudes que coincidan con los filtros."
            : "Cuando una persona solicite representar a otra, la solicitud aparecerá acá para validarla."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
