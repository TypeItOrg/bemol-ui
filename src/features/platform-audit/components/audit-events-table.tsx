"use client";

import type { ReactElement } from "react";

import Link from "next/link";

import { EllipsisVerticalIcon, Loader2Icon, ScrollTextIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { DataTablePagination } from "@common/components/ui/data-table-pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { PAGE_SIZE_OPTIONS } from "@common/utils/pagination-query.util";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_MODULES,
  AUDIT_ACTOR_LABELS,
  AUDIT_MODULE_LABELS,
} from "@features/platform-audit/constants/audit-labels.constants";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import { auditActorName, auditInstitutionName, formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

export function AuditEventsTable({ data, hasFilters }: { data: PaginatedResponse<AuditEvent>; hasFilters: boolean }): ReactElement {
  const { isPending, navigate } = useDataTableNavigation();

  return (
    <div className="flex h-full min-w-0 flex-col gap-4">
      <div className="relative min-h-56 overflow-hidden rounded-lg border" aria-busy={isPending}>
        {data.items.length > 0 ? (
          <Table containerClassName="table-scrollbar" className="min-w-240">
            <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
              <TableRow>
                <TableHead className="w-16 pl-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Realizado por</TableHead>
                <TableHead>Institución</TableHead>
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
                              aria-label={`Abrir acciones de ${AUDIT_ACTION_LABELS[event.action] ?? event.action}, ${formatAuditDateTime(event.occurredAt)}`}
                            >
                              <EllipsisVerticalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40 p-1.5">
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <ReturnToLink href={`/admin/audit-events/${event.id}`} className="px-2.5 py-1.5">
                                  Ver detalle
                                </ReturnToLink>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <time dateTime={event.occurredAt}>{formatAuditDateTime(event.occurredAt)}</time>
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal">{AUDIT_ACTION_LABELS[event.action] ?? "Acción no catalogada"}</TableCell>
                      <TableCell>{AUDIT_MODULE_LABELS[AUDIT_ACTION_MODULES[event.action]] ?? "Módulo no catalogado"}</TableCell>
                      <TableCell className="max-w-64 whitespace-normal">
                        <div className="font-medium">{auditActorName(event)}</div>
                        {event.actorKind !== "ANONYMOUS" ? (
                          <div className="text-muted-foreground text-xs">{AUDIT_ACTOR_LABELS[event.actorKind]}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal">{auditInstitutionName(event)}</TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-40 p-1.5">
                    <ContextMenuGroup>
                      <ContextMenuItem asChild>
                        <ReturnToLink href={`/admin/audit-events/${event.id}`} className="px-2.5 py-1.5">
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
          <Empty className="min-h-56">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ScrollTextIcon />
              </EmptyMedia>
              <EmptyTitle>{hasFilters ? "No hay eventos con estos filtros" : "Todavía no hay eventos registrados"}</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Ajustá el período o limpiá los filtros para ampliar la búsqueda."
                  : "Las acciones auditadas aparecerán aquí cuando se registren."}
              </EmptyDescription>
            </EmptyHeader>
            {hasFilters ? (
              <EmptyContent>
                <Button asChild variant="outline">
                  <Link href="/admin/audit-events">Limpiar filtros</Link>
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        )}
        {isPending ? (
          <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center">
            <Loader2Icon className="text-muted-foreground size-5 animate-spin" aria-label="Cargando auditoría" role="status" />
          </div>
        ) : null}
      </div>
      <DataTablePagination
        page={data.page}
        size={data.size}
        summaryLabel={`${data.totalItems} ${data.totalItems === 1 ? "evento" : "eventos"}.`}
        totalPages={data.totalPages}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        isPending={isPending}
        onPageChange={(page) => navigate({ page: String(page), size: String(data.size) })}
        onPageSizeChange={(size) => navigate({ page: "0", size })}
      />
    </div>
  );
}
