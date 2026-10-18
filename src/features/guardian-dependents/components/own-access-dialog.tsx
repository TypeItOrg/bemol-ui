"use client";

import { useActionState, type ReactElement } from "react";

import { CircleAlertIcon, UserCheckIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
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
import { Field, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";

import { updateOwnAccess } from "@features/guardian-dependents/actions/update-own-access.action";
import type { GuardianDependent } from "@features/guardian-dependents/types/guardian-dependent.types";

export function OwnAccessDialog({
  institutionId,
  person,
  onClose,
  onSuccess,
}: {
  institutionId: string;
  person: GuardianDependent;
  onClose: () => void;
  onSuccess: () => void;
}): ReactElement {
  const [state, action, pending] = useActionState(async (previous: { error?: string; success?: boolean }, form: FormData) => {
    const result = await updateOwnAccess(institutionId, person.personGuardianId, previous, form);

    if (result.success) {
      onSuccess();
    }

    return result;
  }, {});

  const submitLabel = "Enviar invitación";

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <ActionForm action={action} className="space-y-5">
          <AlertDialogHeader>
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <UserCheckIcon aria-hidden="true" className="size-6" />
            </div>
            <AlertDialogTitle>Invitar a activar su cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              Recibirá una invitación para configurar su contraseña. No cambia sus roles ni su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input type="hidden" name="enabled" value="true" />
          <Field>
            <FieldLabel htmlFor="own-access-email" required>
              Correo de la persona
            </FieldLabel>
            <Input id="own-access-email" name="email" type="email" required disabled={pending} />
          </Field>
          {state.error ? (
            <Alert variant="destructive" aria-live="polite">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={pending}>
              Cancelar
            </AlertDialogCancel>
            <Button size="lg" type="submit" variant="default" disabled={pending}>
              {pending ? "Guardando…" : submitLabel}
            </Button>
          </AlertDialogFooter>
        </ActionForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}
