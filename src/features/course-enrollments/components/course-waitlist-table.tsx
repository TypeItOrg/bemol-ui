"use client";

import { useState, useTransition, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { ClockIcon, RefreshCwIcon, SearchIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { DataTableFilters } from "@common/components/ui/data-table-filters";
import { useDataTableNavigation } from "@common/components/ui/data-table-navigation";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@common/components/ui/empty";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@common/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@common/components/ui/tooltip";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { CourseWaitlistRow } from "@features/course-enrollments/components/course-waitlist-row";
import type { CourseWaitlistEntry } from "@features/course-enrollments/types/course-waitlist-entry.types";
import type { CourseWaitlistFilters } from "@features/course-enrollments/types/course-waitlist-filters.types";
import { EnrollmentApplicationCourseDialog } from "@features/enrollment-applications/components/enrollment-application-courses-management";

type CourseWaitlistTableProps = {
  entries: readonly CourseWaitlistEntry[];
  filters?: CourseWaitlistFilters;
  preferredShifts?: readonly string[];
  canEnroll?: boolean;
  institutionId?: string;
  scope?: AcademicScope;
};

export function CourseWaitlistTable({
  entries,
  filters = {},
  preferredShifts = [],
  canEnroll = false,
  institutionId,
  scope = AcademicScope.INSTITUTIONAL,
}: CourseWaitlistTableProps): ReactElement {
  const router = useRouter();

  const { isPending: isNavigating, navigate } = useDataTableNavigation();

  const [isRefreshing, startRefresh] = useTransition();

  const [selected, setSelected] = useState<CourseWaitlistEntry>();

  const { search = "", capacity = "all", shift = "all" } = filters;

  const shiftOptions = [
    { value: "all", label: "Todos los turnos" },
    { value: "__without_shift__", label: "Sin preferencia de turno" },
    ...preferredShifts.map((value) => ({ value, label: value })),
  ];

  if (!shiftOptions.some((option) => option.value === shift)) {
    shiftOptions.push({ value: shift, label: shift });
  }

  const hasFilters = search.length > 0 || capacity !== "all" || shift !== "all";

  const isPending = isNavigating || isRefreshing;

  const EmptyIcon = hasFilters ? SearchIcon : ClockIcon;

  return (
    <div className="flex h-full flex-col gap-4">
      <DataTableFilters
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))] [&>label]:sm:col-span-2 [&>label]:xl:col-span-1"
        search={search}
        searchPlaceholder="Buscar por nombre o documento..."
        selectFilters={[
          {
            defaultValue: "all",
            label: "Disponibilidad",
            name: "capacity",
            options: [
              { value: "all", label: "Todas las situaciones" },
              { value: "available", label: "Cupo disponible" },
              { value: "full", label: "Sin cupos" },
            ],
            value: capacity,
          },
          { defaultValue: "all", label: "Turno preferido", name: "shift", options: shiftOptions, value: shift },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">Los cupos quedan libres hasta que confirmes una incorporación.</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label={isRefreshing ? "Actualizando lista de espera" : "Actualizar lista de espera"}
              disabled={isPending}
              onClick={() => startRefresh(() => router.refresh())}
            >
              <RefreshCwIcon className={isRefreshing ? "motion-safe:animate-spin" : undefined} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Actualizar lista y cupos</TooltipContent>
        </Tooltip>
      </div>
      <div className="relative flex flex-1 overflow-hidden rounded-lg border" aria-busy={isPending}>
        {entries.length === 0 ? (
          <Empty className="min-h-56 p-6">
            <EmptyHeader className="max-w-sm">
              <EmptyMedia variant="icon">
                <EmptyIcon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle className="text-base">{hasFilters ? "No se encontraron postulantes" : "No hay personas en espera"}</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Probá con otra búsqueda o limpiá los filtros para ver toda la lista."
                  : "Cuando se agoten los cupos, las solicitudes en espera van a aparecer acá."}
              </EmptyDescription>
            </EmptyHeader>
            {hasFilters ? (
              <EmptyContent className="w-auto max-w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ search: undefined, capacity: undefined, shift: undefined, page: "0" }, { replace: true })}
                >
                  Limpiar filtros
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : (
          <Table className="min-w-192">
            <TableHeader className="bg-muted sticky top-0 z-10 [&_tr]:border-b">
              <TableRow className="hover:bg-muted/50 data-[state=selected]:bg-muted h-11 border-b transition-colors">
                {canEnroll ? (
                  <TableHead className="w-16 pl-4">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                ) : null}
                <TableHead className={canEnroll ? undefined : "pl-4"}>Número</TableHead>
                <TableHead>Postulante</TableHead>
                <TableHead>Solicitud</TableHead>
                <TableHead>Motivo original</TableHead>
                <TableHead>Situación actual</TableHead>
                <TableHead>Turno preferido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <CourseWaitlistRow
                  key={entry.applicationCourseId}
                  entry={entry}
                  canEnroll={canEnroll}
                  isPending={isPending}
                  onEnroll={() => setSelected(entry)}
                />
              ))}
            </TableBody>
          </Table>
        )}
        {isPending ? (
          <div className="bg-background/55 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]">
            <span className="sr-only" role="status" aria-live="polite">
              Cargando lista de espera
            </span>
          </div>
        ) : null}
      </div>
      {selected ? (
        <EnrollmentApplicationCourseDialog
          applicationId={selected.applicationId}
          course={selected.applicationCourse}
          institutionId={institutionId}
          scope={scope}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelected(undefined);
            }
          }}
          onResolved={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
