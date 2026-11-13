"use client";

import { useState, type ReactElement } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EllipsisVerticalIcon, FileTextIcon, PlusIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DataTableIconLabel } from "@common/components/ui/data-table-icon-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { Skeleton } from "@common/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import { useSearchParamNavigation } from "@common/hooks/use-search-param-navigation";
import type { PaginatedResponse } from "@common/types/paginated-response.types";
import { parsePaginationQuery } from "@common/utils/pagination-query.util";
import { appendReturnTo, getSafeReturnTo } from "@common/utils/return-to.util";

import { EnrollmentFormAssignments } from "@features/enrollment-forms/components/enrollment-form-assignments";
import { EnrollmentFormCreateDialog } from "@features/enrollment-forms/components/enrollment-form-create-dialog";
import { EnrollmentFormEmptyState } from "@features/enrollment-forms/components/enrollment-form-empty-state";
import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { EnrollmentFormPagination } from "@features/enrollment-forms/components/enrollment-form-pagination";
import { useEnrollmentFormResource } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormModel } from "@features/enrollment-forms/types/enrollment-form-model.types";

export function EnrollmentFormWorkspace({ context, returnTo }: { context: EnrollmentFormContext; returnTo: string }): ReactElement {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { navigate } = useSearchParamNavigation();

  const { page, size } = parsePaginationQuery({
    page: searchParams.get("page") ?? undefined,
    size: searchParams.get("size") ?? undefined,
  });

  const [creating, setCreating] = useState(false);

  const models = useEnrollmentFormResource<PaginatedResponse<EnrollmentFormModel>>(context, `enrollment-forms?page=${page}&size=${size}`);

  return (
    <div className="min-w-0 space-y-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() =>
          router.push(getSafeReturnTo(returnTo, context.scope === "platform" ? `/institutions/${context.institutionId}` : "/institution"))
        }
      >
        Volver
      </Button>
      <section aria-labelledby="enrollment-form-models-title" className="bg-muted/25 flex min-w-0 flex-col gap-4 rounded-xl border p-4 sm:p-5 md:p-6">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5 md:-mx-6 md:px-6">
          <SectionHeader
            icon={FileTextIcon}
            title="Tus formularios de inscripción"
            titleId="enrollment-form-models-title"
            description="Elegí un formulario para editar sus secciones y preguntas. Cuando esté listo, publicalo y asignalo a un trayecto."
            action={
              context.canUpdate ? (
                <Button size="lg" onClick={() => setCreating(true)}>
                  <PlusIcon data-icon="inline-start" aria-hidden="true" /> Nuevo formulario
                </Button>
              ) : null
            }
          />
        </header>
        <EnrollmentFormFeedback error={models.error} />
        {models.isPending ? <Skeleton role="status" aria-label="Cargando formularios" className="h-40" /> : null}
        {models.data?.totalItems === 0 ? (
          <EnrollmentFormEmptyState
            icon={FileTextIcon}
            title="Empezá con tu primer formulario"
            description="Partí de los bloques de Bemol y adaptalos a tu institución. Sin una asignación, las inscripciones usan el formulario base."
          />
        ) : null}
        {models.data?.items.length ? (
          <div className="bg-background min-w-0 overflow-hidden rounded-lg border">
            <Table stickyActions aria-label="Formularios de inscripción">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-16 pl-4">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                  <TableHead>Formulario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.data.items.map((model) => (
                  <ContextMenu key={model.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow>
                        <TableCell className="w-16 pl-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" aria-label={`Abrir acciones de ${model.name}`}>
                                <EllipsisVerticalIcon aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44 p-1.5">
                              <DropdownMenuItem asChild>
                                <ReturnToLink href={`${pathname}/${model.id}`} className="px-2.5 py-1.5">
                                  Abrir
                                </ReturnToLink>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="font-medium whitespace-normal">
                          <DataTableIconLabel icon={FileTextIcon}>
                            <ReturnToLink href={`${pathname}/${model.id}`} className="hover:underline">
                              {model.name}
                            </ReturnToLink>
                          </DataTableIconLabel>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-44 p-1.5">
                      <ContextMenuItem asChild>
                        <ReturnToLink href={`${pathname}/${model.id}`} className="px-2.5 py-1.5">
                          Abrir
                        </ReturnToLink>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
        {(models.data?.totalPages ?? 0) > 1 ? (
          <EnrollmentFormPagination
            page={page}
            size={size}
            totalItems={models.data?.totalItems}
            totalPages={models.data?.totalPages}
            pending={models.isFetching}
            onPage={(value) => navigate({ page: String(value), size: String(size) })}
            onSize={(value) => navigate({ page: "0", size: String(value) })}
          />
        ) : null}
      </section>
      <EnrollmentFormAssignments context={context} />
      {creating ? (
        <EnrollmentFormCreateDialog
          context={context}
          onClose={() => setCreating(false)}
          onCreated={(model) => {
            setCreating(false);
            router.push(appendReturnTo(`${pathname}/${model.id}`, `${pathname}${searchParams.size ? `?${searchParams}` : ""}`));
          }}
        />
      ) : null}
    </div>
  );
}
