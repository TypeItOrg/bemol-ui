"use client";

import { useId, useState, type ReactElement } from "react";

import { CircleCheckIcon, Clock3Icon, InfoIcon, XIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@common/components/ui/popover";
import { cn } from "@common/utils/cn.util";

import {
  ENROLLMENT_APPLICATION_STATUS,
  type EnrollmentApplicationStatus,
} from "@features/enrollment-applications/types/enrollment-application-status.types";
import { getEnrollmentApplicationStatusLabel } from "@features/enrollment-applications/utils/enrollment-application-status.util";

type EnrollmentApplicationStatusBadgeProps = {
  status: EnrollmentApplicationStatus;
  rejectionReason?: string | null;
  pendingCourses?: boolean | null;
  detailHref?: string;
  size?: "default" | "lg";
};

const STATUS_CLASSNAMES: Record<EnrollmentApplicationStatus, string> = {
  [ENROLLMENT_APPLICATION_STATUS.DRAFT]: "border-border text-foreground",
  [ENROLLMENT_APPLICATION_STATUS.PROVISIONALLY_APPROVED]: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  [ENROLLMENT_APPLICATION_STATUS.SUBMITTED]:
    "bg-amber-500/15 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  [ENROLLMENT_APPLICATION_STATUS.APPROVED]:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  [ENROLLMENT_APPLICATION_STATUS.REJECTED]: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  [ENROLLMENT_APPLICATION_STATUS.CANCELLED]: "bg-muted text-muted-foreground border-border",
};

export function EnrollmentApplicationStatusBadge({
  status,
  rejectionReason,
  pendingCourses,
  detailHref,
  size = "default",
}: EnrollmentApplicationStatusBadgeProps): ReactElement {
  const [open, setOpen] = useState(false);

  const id = useId();

  const isRejected = status === ENROLLMENT_APPLICATION_STATUS.REJECTED;

  const hasCourseResolution =
    (status === ENROLLMENT_APPLICATION_STATUS.APPROVED || status === ENROLLMENT_APPLICATION_STATUS.PROVISIONALLY_APPROVED) &&
    typeof pendingCourses === "boolean";

  const statusLabel = getEnrollmentApplicationStatusLabel(status);

  const statusClassName = STATUS_CLASSNAMES[status];

  const CourseResolutionIcon = pendingCourses ? Clock3Icon : CircleCheckIcon;

  const courseResolutionLabel = pendingCourses ? "Cursos pendientes" : "Cursos resueltos";

  const popoverTitle = isRejected ? "Motivo de rechazo" : courseResolutionLabel;

  const courseResolutionDescription = pendingCourses
    ? "Hay cursos seleccionados que todavía no tienen una resolución. La confirmación de la solicitud no implica que todos los cursos estén resueltos."
    : "Todos los cursos seleccionados tienen una resolución.";

  const popoverDescription = isRejected ? rejectionReason?.trim() || "Sin motivo informado" : courseResolutionDescription;

  if (isRejected || hasCourseResolution) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Badge asChild variant="outline" size={size} className={cn(statusClassName, "cursor-pointer hover:brightness-95")}>
            <button type="button" aria-label={`${statusLabel}: ver ${popoverTitle.toLowerCase()}`}>
              {statusLabel}
              {isRejected ? (
                <InfoIcon aria-hidden="true" />
              ) : (
                <CourseResolutionIcon
                  className={pendingCourses ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}
                  aria-hidden="true"
                />
              )}
            </button>
          </Badge>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={16}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-reason`}
          className="max-h-[min(24rem,var(--radix-popover-content-available-height))] w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-y-auto p-4"
        >
          <div className="flex items-start gap-2">
            <PopoverHeader className="min-w-0 flex-1">
              <PopoverTitle id={`${id}-title`}>{popoverTitle}</PopoverTitle>
            </PopoverHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground -mt-1 -mr-1"
              aria-label={`Cerrar ${popoverTitle.toLowerCase()}`}
              onClick={() => setOpen(false)}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <PopoverDescription id={`${id}-reason`} className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
            {popoverDescription}
          </PopoverDescription>
          {hasCourseResolution && detailHref ? (
            <Button asChild size="lg" className="w-full">
              <ReturnToLink href={detailHref}>Ver detalle de la solicitud</ReturnToLink>
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Badge variant="outline" size={size} className={statusClassName}>
      {statusLabel}
    </Badge>
  );
}
