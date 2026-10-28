"use client";

import { startTransition, useActionState, type ReactElement, type SyntheticEvent } from "react";

import { CircleAlertIcon, CircleXIcon } from "lucide-react";

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

type RejectGuardianLinkDialogProps = {
  institutionId?: string;
  onClose: () => void;
  onRejected: (requestId: string) => void;
  onResolve: (institutionId: string, linkId: string, decision: GuardianLinkDecision) => Promise<{ error?: string }>;
  request: GuardianLinkRequest;
};

type RejectActionState = FieldActionState<never>;

export function RejectGuardianLinkDialog({ institutionId, onClose, onRejected, onResolve, request }: RejectGuardianLinkDialogProps): ReactElement {
  const [state, action, isPending] = useActionState<RejectActionState, FormData>(async () => {
    const requestInstitutionId = institutionId ?? request.institution?.institutionId;

    if (!requestInstitutionId) {
      return { error: "La solicitud no tiene una institución asociada." };
    }

    try {
      const result = await onResolve(requestInstitutionId, request.personGuardianId, "reject");

      if (result.error) {
        return { error: result.error };
      }

      onRejected(request.personGuardianId);

      return { success: true };
    } catch {
      return { error: GUARDIAN_LINK_MESSAGES.RESOLVE };
    }
  }, {});

  const tutorName = getGuardianDependentName(request.tutor) || request.tutor.documentNumber;

  const dependent = request.matchingPerson ?? request.dependent;

  const dependentName = getGuardianDependentName(dependent) || dependent.documentNumber;

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
            <div className="bg-destructive/10 text-destructive mb-1 flex size-12 items-center justify-center rounded-2xl">
              <CircleXIcon aria-hidden="true" className="size-6" />
            </div>
            <AlertDialogTitle>Rechazar vinculación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de rechazar la solicitud de vinculación de <span className="text-foreground font-semibold">{tutorName}</span> con{" "}
              <span className="text-foreground font-semibold">{dependentName}</span>? No se aprobará este vínculo de representación.
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
            <Button disabled={isPending} size="lg" type="submit" variant="destructive">
              {isPending ? "Rechazando…" : "Rechazar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
