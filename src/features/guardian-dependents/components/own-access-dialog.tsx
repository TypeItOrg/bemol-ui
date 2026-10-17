"use client";

import { useActionState, type ReactElement } from "react";

import { CircleAlertIcon, UserCheckIcon, UserXIcon } from "lucide-react";

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
import { cn } from "@common/utils/cn.util";

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
  const disabling = person.ownAccessStatus === "ENABLED" || person.ownAccessStatus === "INVITATION_PENDING";

  const [state, action, pending] = useActionState(async (previous: { error?: string; success?: boolean }, form: FormData) => {
    const result = await updateOwnAccess(institutionId, person.personGuardianId, previous, form);

    if (result.success) {
      onSuccess();
    }

    return result;
  }, {});

  const submitLabel = disabling ? "Deshabilitar" : "Habilitar";

  const needsEmail = person.ownAccessStatus === "NO_ACCOUNT";

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
            <div
              className={cn(
                "mb-1 flex size-12 items-center justify-center rounded-2xl",
                disabling ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600",
              )}
            >
              {disabling ? <UserXIcon aria-hidden="true" className="size-6" /> : <UserCheckIcon aria-hidden="true" className="size-6" />}
            </div>
            <AlertDialogTitle>{disabling ? "Deshabilitar acceso propio" : "Habilitar acceso propio"}</AlertDialogTitle>
            <AlertDialogDescription>
              {disabling
                ? "Se cerrarán sus sesiones y no podrá ingresar con sus credenciales. Podrás seguir gestionando sus trámites desde tu cuenta."
                : "Si todavía no tiene cuenta, recibirá una invitación para configurar su contraseña. No cambia sus roles ni su historial."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input type="hidden" name="enabled" value={String(!disabling)} />
          {needsEmail ? (
            <Field>
              <FieldLabel htmlFor="own-access-email" required>
                Correo de la persona
              </FieldLabel>
              <Input id="own-access-email" name="email" type="email" required disabled={pending} />
            </Field>
          ) : null}
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
            <Button size="lg" type="submit" variant={disabling ? "destructive" : "default"} disabled={pending}>
              {pending ? "Guardando…" : submitLabel}
            </Button>
          </AlertDialogFooter>
        </ActionForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}
