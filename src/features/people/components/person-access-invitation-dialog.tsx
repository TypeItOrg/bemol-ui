"use client";

import { useActionState, type ReactElement } from "react";

import { CircleAlertIcon, MailIcon, MailXIcon } from "lucide-react";

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
import { Field, FieldError, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { useActionFormErrorFocus } from "@common/hooks/use-action-form-error-focus";
import { cn } from "@common/utils/cn.util";

import { manageAccountAccess, type ManageAccountAccessState } from "@features/people/actions/manage-account-access.action";
import type { PersonSummary } from "@features/people/types/person-summary.types";
import type { PeopleScope } from "@features/people/utils/people-scope.util";

export function PersonAccessInvitationDialog({
  institutionId,
  person,
  cancel,
  scope = "institutional",
  onClose,
  onSuccess,
}: {
  institutionId: string;
  person: PersonSummary;
  cancel: boolean;
  scope?: PeopleScope;
  onClose: () => void;
  onSuccess: () => void;
}): ReactElement {
  const [state, action, pending] = useActionState(async (previous: ManageAccountAccessState, form: FormData) => {
    const result = await manageAccountAccess(scope, institutionId, person.id, previous, form);

    if (result.success) {
      onSuccess();
    }

    return result;
  }, {});

  const formRef = useActionFormErrorFocus(state, pending);

  const sendLabel = person.accessInvitationPending ? "Reenviar invitación" : "Invitar a activar acceso";

  const label = cancel ? "Cancelar invitación" : sendLabel;

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
        <ActionForm ref={formRef} action={action} className="space-y-5">
          <AlertDialogHeader>
            <div
              className={cn(
                "mb-1 flex size-12 items-center justify-center rounded-2xl",
                cancel ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
              )}
            >
              {cancel ? <MailXIcon aria-hidden="true" className="size-6" /> : <MailIcon aria-hidden="true" className="size-6" />}
            </div>
            <AlertDialogTitle>{label}</AlertDialogTitle>
            <AlertDialogDescription>
              {cancel
                ? `Se invalidará el enlace de acceso inicial de ${person.firstName} ${person.lastName}. No cambiarán sus roles ni sus representaciones.`
                : `${person.firstName} ${person.lastName} recibirá un enlace válido por 24 horas para elegir su contraseña. Verificá que el correo pertenezca a esa persona: la cuenta tendrá sus roles actuales. Reenviar invalida el enlace anterior.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input type="hidden" name="operation" value={cancel ? "cancel" : "invite"} />
          {!cancel ? (
            <Field data-invalid={!!state.fieldErrors?.email}>
              <FieldLabel htmlFor="initial-access-email" required>
                Correo de la persona
              </FieldLabel>
              <Input
                id="initial-access-email"
                name="email"
                type="email"
                maxLength={150}
                required
                defaultValue={person.email ?? ""}
                disabled={pending}
                aria-invalid={!!state.fieldErrors?.email}
                aria-describedby={state.fieldErrors?.email ? "initial-access-email-error" : undefined}
              />
              <FieldError id="initial-access-email-error">{state.fieldErrors?.email}</FieldError>
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
              Volver
            </AlertDialogCancel>
            <Button size="lg" type="submit" variant={cancel ? "destructive" : "default"} disabled={pending}>
              {pending ? "Guardando…" : label}
            </Button>
          </AlertDialogFooter>
        </ActionForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}
