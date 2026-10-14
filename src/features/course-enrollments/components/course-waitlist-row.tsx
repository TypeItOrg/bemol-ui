"use client";

import type { ReactElement } from "react";

import { EllipsisVerticalIcon } from "lucide-react";

import { OptionalValue } from "@common/components/optional-value";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@common/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@common/components/ui/table";

import { WAITLIST_REASON_LABELS } from "@features/course-enrollments/constants/course-enrollment.constants";
import type { CourseWaitlistEntry } from "@features/course-enrollments/types/course-waitlist-entry.types";
import { formatEnrollmentApplicationDate } from "@features/enrollment-applications/utils/enrollment-application-date.util";

type CourseWaitlistRowProps = {
  entry: CourseWaitlistEntry;
  canEnroll: boolean;
  isPending: boolean;
  onEnroll: () => void;
};

export function CourseWaitlistRow({ entry, canEnroll, isPending, onEnroll }: CourseWaitlistRowProps): ReactElement {
  function renderActions(Item: typeof DropdownMenuItem | typeof ContextMenuItem): ReactElement {
    return (
      <Item className="px-2.5 py-1.5" disabled={!entry.hasCapacity || isPending} onSelect={onEnroll}>
        Incorporar
      </Item>
    );
  }

  const row = (
    <TableRow className="hover:bg-muted/50 h-12 border-b transition-colors">
      {canEnroll ? (
        <TableCell className="w-16 pl-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Abrir acciones de ${entry.applicantName}`}>
                <EllipsisVerticalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1.5">
              {renderActions(DropdownMenuItem)}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      ) : null}
      <TableCell className={canEnroll ? "font-semibold tabular-nums" : "pl-4 font-semibold tabular-nums"}>{entry.waitlistNumber}</TableCell>
      <TableCell>
        <div className="font-medium">{entry.applicantName}</div>
        <div className="text-muted-foreground">{entry.applicantDocumentNumber}</div>
      </TableCell>
      <TableCell>{formatEnrollmentApplicationDate(entry.waitlistedAt)}</TableCell>
      <TableCell>
        <OptionalValue
          value={entry.originalReason ? (WAITLIST_REASON_LABELS[entry.originalReason] ?? entry.originalReason) : null}
          fallback="Sin motivo informado"
        />
      </TableCell>
      <TableCell>
        <Badge variant={entry.hasCapacity ? "success" : "secondary"}>{entry.hasCapacity ? "Cupo disponible" : "Sin cupos"}</Badge>
      </TableCell>
      <TableCell>
        <OptionalValue value={entry.preferredShift} fallback="Sin preferencia de turno" />
      </TableCell>
    </TableRow>
  );

  if (!canEnroll) {
    return row;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 p-1.5">{renderActions(ContextMenuItem)}</ContextMenuContent>
    </ContextMenu>
  );
}
