"use client";

import { useState, type ReactElement } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { EllipsisVerticalIcon, RouteIcon, UnlinkIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { SectionHeader } from "@common/components/section-header";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { Skeleton } from "@common/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import { useSearchParamNavigation } from "@common/hooks/use-search-param-navigation";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parsePaginationQuery } from "@common/utils/pagination-query.util";

import { EnrollmentFormConfirm } from "@features/enrollment-forms/components/enrollment-form-confirm";
import { EnrollmentFormEmptyState } from "@features/enrollment-forms/components/enrollment-form-empty-state";
import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { EnrollmentFormPagination } from "@features/enrollment-forms/components/enrollment-form-pagination";
import { EnrollmentFormReassignmentDialog } from "@features/enrollment-forms/components/enrollment-form-reassignment-dialog";
import { useEnrollmentFormResource } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormAssignment } from "@features/enrollment-forms/types/enrollment-form-assignment.types";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import { getEnrollmentFormVersionLabel } from "@features/enrollment-forms/utils/enrollment-form-version-label.util";

export function EnrollmentFormAssignments({ context }: { context: EnrollmentFormContext }): ReactElement {
  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { navigate } = useSearchParamNavigation();

  const { page, size } = parsePaginationQuery({
    page: searchParams.get("assignmentsPage") ?? undefined,
    size: searchParams.get("assignmentsSize") ?? undefined,
  });

  const [retiring, setRetiring] = useState<EnrollmentFormAssignment>();

  const [replacing, setReplacing] = useState<EnrollmentFormAssignment>();

  const assignments = useEnrollmentFormResource<PaginatedResponse<EnrollmentFormAssignment>>(
    context,
    `enrollment-form-assignments?page=${page}&size=${size}`,
  );

  const items = assignments.data?.items ?? [];

  return (
    <section
      aria-labelledby="enrollment-form-assignments-title"
      className="bg-muted/25 flex min-w-0 flex-col gap-4 rounded-xl border p-4 sm:p-5 md:p-6"
    >
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5 md:-mx-6 md:px-6">
        <SectionHeader
          icon={RouteIcon}
          title="Formularios por trayecto y ciclo"
          titleId="enrollment-form-assignments-title"
          description="Elegí qué versión publicada usa cada trayecto y ciclo. Sin asignación, se usa el formulario base."
        />
      </header>
      <EnrollmentFormFeedback error={assignments.error} />
      {assignments.isPending ? <Skeleton role="status" aria-label="Cargando asignaciones" className="h-72 rounded-lg" /> : null}
      {assignments.data?.totalItems === 0 ? (
        <EnrollmentFormEmptyState
          icon={RouteIcon}
          title="Todavía no hay formularios asignados"
          description="Publicá un formulario y asignalo a un trayecto y ciclo lectivo. Los cambios no alteran inscripciones anteriores."
        />
      ) : null}
      {items.length > 0 ? (
        <div className="bg-background min-w-0 overflow-hidden rounded-lg border">
          <Table stickyActions aria-label="Formularios por trayecto y ciclo">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-16 pl-4">
                  <span className="sr-only">Acciones</span>
                </TableHead>
                <TableHead>Trayecto</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Formulario</TableHead>
                <TableHead>Versión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow>
                      <TableCell className="w-16 pl-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Abrir acciones de ${item.trainingPathName}, ${item.academicYear}`}
                            >
                              <EllipsisVerticalIcon aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44 p-1.5">
                            <DropdownMenuItem asChild>
                              <ReturnToLink href={`${pathname}/${item.formId}?versionId=${item.formVersionId}`} className="px-2.5 py-1.5">
                                Abrir
                              </ReturnToLink>
                            </DropdownMenuItem>
                            {context.canUpdate ? (
                              <>
                                <DropdownMenuItem className="px-2.5 py-1.5" onSelect={() => setReplacing(item)}>
                                  Cambiar versión
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setRetiring(item)}>
                                  Retirar
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="font-medium">{item.trainingPathName}</TableCell>
                      <TableCell>{item.academicYear}</TableCell>
                      <TableCell>
                        <ReturnToLink href={`${pathname}/${item.formId}?versionId=${item.formVersionId}`} className="hover:underline">
                          {item.formName}
                        </ReturnToLink>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getEnrollmentFormVersionLabel(item.versionNumber)}</Badge>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-44 p-1.5">
                    <ContextMenuItem asChild>
                      <ReturnToLink href={`${pathname}/${item.formId}?versionId=${item.formVersionId}`} className="px-2.5 py-1.5">
                        Abrir
                      </ReturnToLink>
                    </ContextMenuItem>
                    {context.canUpdate ? (
                      <>
                        <ContextMenuItem className="px-2.5 py-1.5" onSelect={() => setReplacing(item)}>
                          Cambiar versión
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setRetiring(item)}>
                          Retirar
                        </ContextMenuItem>
                      </>
                    ) : null}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {assignments.data && assignments.data.totalItems > 0 ? (
        <EnrollmentFormPagination
          page={page}
          size={size}
          totalItems={assignments.data.totalItems}
          totalPages={assignments.data.totalPages}
          pending={assignments.isFetching}
          onPage={(value) => navigate({ assignmentsPage: String(value), assignmentsSize: String(size) })}
          onSize={(value) => navigate({ assignmentsPage: "0", assignmentsSize: String(value) })}
        />
      ) : null}
      {replacing ? <EnrollmentFormReassignmentDialog context={context} assignment={replacing} onClose={() => setReplacing(undefined)} /> : null}
      {retiring ? (
        <EnrollmentFormConfirm
          context={context}
          command={{ kind: "unassign", assignmentId: retiring.id, expectedRevision: retiring.revision }}
          icon={UnlinkIcon}
          destructive
          title="Retirar asignación"
          description={`Las nuevas inscripciones de ${retiring.trainingPathName}, ciclo ${retiring.academicYear}, usarán el formulario base. Las existentes conservarán su versión y respuestas.`}
          confirmLabel="Retirar asignación"
          pendingLabel="Retirando…"
          onClose={() => setRetiring(undefined)}
        />
      ) : null}
    </section>
  );
}
