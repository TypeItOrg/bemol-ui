"use client";

import { startTransition, useActionState, type ReactElement, type SyntheticEvent } from "react";

import { CircleAlertIcon, UserCheckIcon } from "lucide-react";

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
import type { FieldActionState } from "@common/utils/action-state.util";

import { getGuardianDependentName } from "@features/guardian-dependents/utils/guardian-dependent-display.util";
import { GUARDIAN_LINK_MESSAGES } from "@features/guardian-links/constants/guardian-link.constants";
import type { GuardianLinkDecision } from "@features/guardian-links/types/guardian-link-decision.types";
import type { GuardianLinkRequest } from "@features/guardian-links/types/guardian-link-request.types";

type ApproveGuardianLinkDialogProps = {
  institutionId?: string;
  onApproved: (requestId: string) => void;
  onClose: () => void;
  onResolve: (institutionId: string, linkId: string, decision: GuardianLinkDecision) => Promise<{ error?: string }>;
  request: GuardianLinkRequest;
};

type ApproveActionState = FieldActionState<never>;

export function ApproveGuardianLinkDialog({ institutionId, onApproved, onClose, onResolve, request }: ApproveGuardianLinkDialogProps): ReactElement {
  const [state, action, isPending] = useActionState<ApproveActionState, FormData>(async () => {
    const requestInstitutionId = institutionId ?? request.institution?.institutionId;

    if (!requestInstitutionId) {
      return { error: "La solicitud no tiene una institución asociada." };
    }

    try {
      const result = await onResolve(requestInstitutionId, request.personGuardianId, "approve");

      if (result.error) {
        return { error: result.error };
      }

      onApproved(request.personGuardianId);

      return { success: true };
    } catch {
      return { error: GUARDIAN_LINK_MESSAGES.RESOLVE };
    }
  }, {});

  const tutorName = getGuardianDependentName(request.tutor);

  const dependentName = getGuardianDependentName(request.dependent);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (isPending) {
      return;
    }

    startTransition(() => action(new FormData()));
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <div className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <UserCheckIcon aria-hidden="true" className="size-6" />
            </div>
            <AlertDialogTitle>Aceptar vinculación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de aceptar la solicitud de vinculación de <span className="text-foreground font-semibold">{tutorName}</span> con{" "}
              <span className="text-foreground font-semibold">{dependentName}</span>? A partir de este momento podrá gestionar sus trámites académicos
              y habilitar o deshabilitar su acceso propio a la plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel disabled={isPending} size="lg" type="button">
              Cancelar
            </AlertDialogCancel>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending ? "Aceptando…" : "Aceptar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
