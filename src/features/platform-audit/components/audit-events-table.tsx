"use client";

import type { ReactElement } from "react";

import Link from "next/link";

import { BuildingIcon, CalendarIcon, EllipsisVerticalIcon, Loader2Icon, MailIcon, ScrollTextIcon, SearchIcon, UserRoundIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DataTableIconLabel } from "@common/components/ui/data-table-icon-badge";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { DataTablePagination } from "@common/components/ui/data-table-pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { PAGE_SIZE_OPTIONS } from "@common/utils/pagination-query.util";

import { AUDIT_ACTOR_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import { MAIL_RESULT_LABELS } from "@features/platform-audit/constants/mail-labels.constants";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import { auditActionLabel, auditActorName, auditInstitutionName, formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

export function AuditEventsTable({
  data,
  hasFilters,
  mailView = false,
  basePath: customBasePath,
  showInstitution = true,
}: {
  data: PaginatedResponse<AuditEvent>;
  hasFilters: boolean;
  mailView?: boolean;
  basePath?: string;
  showInstitution?: boolean;
}): ReactElement {
  const { isPending, navigate } = useDataTableNavigation();

  const basePath = customBasePath ?? (mailView ? "/emails" : "/audit-events");

  const noun = mailView ? "correo" : "evento";

  const EmptyIcon = mailView ? MailIcon : ScrollTextIcon;

  const emptyTitle = hasFilters ? `No se encontraron ${noun}s` : `Todavía no hay ${noun}s registrados`;

  const emptyDescription = mailView
    ? "Los intentos de envío aparecerán aquí cuando se registren."
    : "Las acciones auditadas aparecerán aquí cuando se registren.";

  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      <div className="relative flex min-h-56 flex-1 overflow-hidden rounded-lg border" aria-busy={isPending}>
        {data.items.length > 0 ? (
          <Table stickyActions containerClassName="table-scrollbar" className="min-w-240">
            <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
              <TableRow>
                <TableHead className="w-16 pl-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>{mailView ? "Tipo de correo" : "Acción"}</TableHead>
                <TableHead>{mailView ? "Destinatario" : "Módulo"}</TableHead>
                <TableHead>{mailView ? "Resultado" : "Realizado por"}</TableHead>
                {showInstitution ? <TableHead>Institución</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((event) => (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow>
                      <TableCell className="w-16 pl-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Abrir acciones de ${auditActionLabel(event)}, ${formatAuditDateTime(event.occurredAt)}`}
                            >
                              <EllipsisVerticalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40 p-1.5">
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <ReturnToLink href={`${basePath}/${event.id}`} className="px-2.5 py-1.5">
                                  Ver detalle
                                </ReturnToLink>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <DataTableIconLabel icon={CalendarIcon}>
                          <time dateTime={event.occurredAt}>{formatAuditDateTime(event.occurredAt)}</time>
                        </DataTableIconLabel>
                      </TableCell>
                      {mailView ? (
                        <>
                          <TableCell className="max-w-64 whitespace-normal">
                            <DataTableIconLabel icon={MailIcon}>
                              <span>{typeof event.details.mailType === "string" ? event.details.mailType : "No registrado"}</span>
                            </DataTableIconLabel>
                          </TableCell>
                          <TableCell className="max-w-64 break-all whitespace-normal">
                            <DataTableIconLabel icon={UserRoundIcon}>
                              <span>{typeof event.details.recipient === "string" ? event.details.recipient : "No registrado"}</span>
                            </DataTableIconLabel>
                          </TableCell>
                          <TableCell>
                            <Badge variant={event.action === "EMAIL_FAILED" ? "destructive" : "success"}>
                              {MAIL_RESULT_LABELS[event.action] ?? "No registrado"}
                            </Badge>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="max-w-64 whitespace-normal">
                            <DataTableIconLabel icon={ScrollTextIcon}>
                              <span>{auditActionLabel(event)}</span>
                            </DataTableIconLabel>
                          </TableCell>
                          <TableCell>{event.moduleLabel ?? "Módulo no disponible"}</TableCell>
                          <TableCell className="max-w-64 whitespace-normal">
                            <DataTableIconLabel icon={UserRoundIcon}>
                              <div>
                                <div className="font-medium">{auditActorName(event)}</div>
                                {event.actorKind !== "ANONYMOUS" ? (
                                  <div className="text-muted-foreground text-xs">{AUDIT_ACTOR_LABELS[event.actorKind]}</div>
                                ) : null}
                              </div>
                            </DataTableIconLabel>
                          </TableCell>
                        </>
                      )}
                      {showInstitution ? (
                        <TableCell className="max-w-64 whitespace-normal">
                          <DataTableIconLabel icon={BuildingIcon}>
                            <span>{auditInstitutionName(event)}</span>
                          </DataTableIconLabel>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-40 p-1.5">
                    <ContextMenuGroup>
                      <ContextMenuItem asChild>
                        <ReturnToLink href={`${basePath}/${event.id}`} className="px-2.5 py-1.5">
                          Ver detalle
                        </ReturnToLink>
                      </ContextMenuItem>
                    </ContextMenuGroup>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="bg-muted/25 h-full min-h-80 px-4 py-12">
            <EmptyHeader className="max-w-md">
              <EmptyMedia variant="icon">
                {hasFilters ? <SearchIcon className="size-5" aria-hidden="true" /> : <EmptyIcon className="size-5" aria-hidden="true" />}
              </EmptyMedia>
              <EmptyTitle className="mt-2 text-base">{emptyTitle}</EmptyTitle>
              <EmptyDescription>{hasFilters ? "Probá con otra búsqueda o cambiá los filtros." : emptyDescription}</EmptyDescription>
            </EmptyHeader>
            {hasFilters ? (
              <EmptyContent>
                <Button asChild variant="outline" size="lg">
                  <Link href={basePath}>Limpiar filtros</Link>
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        )}
        {isPending ? (
          <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center">
            <Loader2Icon
              className="text-muted-foreground size-5 animate-spin"
              aria-label={mailView ? "Cargando correos" : "Cargando auditoría"}
              role="status"
            />
          </div>
        ) : null}
      </div>
      <DataTablePagination
        page={data.page}
        size={data.size}
        summaryLabel={`${data.totalItems} ${noun}${data.totalItems === 1 ? "" : "s"}.`}
        totalPages={data.totalPages}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        isPending={isPending}
        onPageChange={(page) => navigate({ page: String(page), size: String(data.size) })}
        onPageSizeChange={(size) => navigate({ page: "0", size })}
      />
    </div>
  );
}
