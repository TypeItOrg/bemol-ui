"use client";

import { useActionState, useRef, useState, type ReactElement } from "react";

import { ChevronDownIcon, CircleAlertIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@common/components/ui/alert-dialog";
import { Button } from "@common/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";
import { cn } from "@common/utils/cn.util";

import { updateAcademicStatusAction } from "@features/academic/actions/update-academic-status.action";
import { COURSE_STATUS_DIALOG_CONFIG } from "@features/academic/config/course-status-dialog.config";
import type { AcademicActionState } from "@features/academic/types/academic-action-state.types";
import { AcademicResource } from "@features/academic/types/academic-resource.types";
import type { CourseStatus } from "@features/academic/types/course-status.types";
import type { AcademicScope } from "@features/academic/utils/academic-scope.util";

type CourseStatusDialogProps = {
  id: string;
  institutionId: string;
  onCloseAutoFocus?: (event: Event) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  resourceLabel: string;
  returnTo: string;
  scope: AcademicScope;
  targetStatus: CourseStatus;
};

const INITIAL_STATE: AcademicActionState = {};

export function CourseStatusDialog({
  id,
  institutionId,
  onCloseAutoFocus,
  onOpenChange,
  open,
  resourceLabel,
  returnTo,
  scope,
  targetStatus,
}: CourseStatusDialogProps): ReactElement {
  const [state, formAction, isPending] = useActionState(
    updateAcademicStatusAction.bind(null, scope, institutionId, AcademicResource.COURSE, id, returnTo),
    INITIAL_STATE,
  );

  const config = COURSE_STATUS_DIALOG_CONFIG[targetStatus];

  const Icon = config.icon;

  function handleOpenChange(nextOpen: boolean): void {
    if (isPending && !nextOpen) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <form action={formAction}>
          <AlertDialogHeader>
            <div className={cn(config.iconClassName, "mb-1 flex size-12 items-center justify-center rounded-2xl")}>
              <Icon className="size-6" />
            </div>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            <AlertDialogDescription>{config.description(resourceLabel)}</AlertDialogDescription>
          </AlertDialogHeader>

          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <input type="hidden" name="status" value={targetStatus} />

          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel type="button" size="lg" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" size="lg" variant={config.variant} disabled={isPending}>
              {isPending ? config.pendingLabel : config.actionLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CourseDetailActions({
  canChangeStatus,
  canEdit,
  courseStatus,
  id,
  institutionId,
  resourceLabel,
  returnTo,
  scope,
}: {
  canChangeStatus: boolean;
  canEdit: boolean;
  courseStatus: CourseStatus;
  id: string;
  institutionId: string;
  resourceLabel: string;
  returnTo: string;
  scope: AcademicScope;
}): ReactElement | null {
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);

  const [toggleOpen, setToggleOpen] = useState(false);

  const [finalizeOpen, setFinalizeOpen] = useState(false);

  if (courseStatus === "CLOSED" || (!canEdit && !canChangeStatus)) {
    return null;
  }

  const toggleTarget: CourseStatus = courseStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const toggleConfig = COURSE_STATUS_DIALOG_CONFIG[toggleTarget];

  function restoreActionsFocus(event: Event): void {
    event.preventDefault();
    actionsTriggerRef.current?.focus();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={actionsTriggerRef} type="button" size="lg" variant="outline">
            Acciones
            <ChevronDownIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 p-1.5">
          {canEdit ? (
            <DropdownMenuItem asChild>
              <ReturnToLink href={`${returnTo}/edit`} className="px-2.5 py-1.5">
                Editar
              </ReturnToLink>
            </DropdownMenuItem>
          ) : null}
          {canChangeStatus ? (
            <>
              {canEdit && toggleTarget !== "ACTIVE" ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem variant={toggleConfig.variant} className="px-2.5 py-1.5" onSelect={() => setToggleOpen(true)}>
                {toggleTarget === "ACTIVE" ? "Activar" : "Desactivar"}
              </DropdownMenuItem>
              {toggleTarget === "ACTIVE" ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setFinalizeOpen(true)}>
                Finalizar
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {toggleOpen ? (
        <CourseStatusDialog
          id={id}
          institutionId={institutionId}
          onCloseAutoFocus={restoreActionsFocus}
          onOpenChange={setToggleOpen}
          open={toggleOpen}
          resourceLabel={resourceLabel}
          returnTo={returnTo}
          scope={scope}
          targetStatus={toggleTarget}
        />
      ) : null}
      {finalizeOpen ? (
        <CourseStatusDialog
          id={id}
          institutionId={institutionId}
          onCloseAutoFocus={restoreActionsFocus}
          onOpenChange={setFinalizeOpen}
          open={finalizeOpen}
          resourceLabel={resourceLabel}
          returnTo={returnTo}
          scope={scope}
          targetStatus="CLOSED"
        />
      ) : null}
    </>
  );
}
