"use client";

import { useActionState, type ReactElement } from "react";

import { CircleAlertIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { PasswordInput } from "@common/components/ui/password-input";
import { useActionFormErrorFocus } from "@common/hooks/use-action-form-error-focus";

import { changeInstitutionalPasswordAction } from "@features/institutional-auth/actions/change-institutional-password.action";
import type { InstitutionalPasswordActionState } from "@features/institutional-auth/types/institutional-password-state.types";

const INITIAL_STATE: InstitutionalPasswordActionState = {};

export function InstitutionalPasswordDialog({ onClose }: { onClose: () => void }): ReactElement {
  const [state, formAction, isPending] = useActionState(changeInstitutionalPasswordAction, INITIAL_STATE);

  const formRef = useActionFormErrorFocus(state, isPending);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("change-institutional-password")?.focus({ preventScroll: true });
        }}
      >
        <ActionForm ref={formRef} resetOnSuccess={Boolean(state.success)} action={formAction} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>Al confirmar el cambio se cerrará tu sesión en todos tus dispositivos.</DialogDescription>
          </DialogHeader>
          {state.error ? (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" className="size-4" />
              <AlertTitle>¡Ups! No se pudo cambiar la contraseña</AlertTitle>
              <AlertDescription role="alert">{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <fieldset disabled={isPending} className="min-w-0">
            <FieldGroup className="gap-4">
              <Field data-invalid={!!state.fieldErrors?.currentPassword}>
                <FieldContent>
                  <FieldLabel htmlFor="password-current" required>
                    Contraseña actual
                  </FieldLabel>
                </FieldContent>
                <PasswordInput
                  id="password-current"
                  name="currentPassword"
                  aria-invalid={!!state.fieldErrors?.currentPassword}
                  autoComplete="current-password"
                />
                <FieldError>{state.fieldErrors?.currentPassword}</FieldError>
              </Field>
              <Field data-invalid={!!state.fieldErrors?.password}>
                <FieldContent>
                  <FieldLabel htmlFor="password-new" required>
                    Nueva contraseña
                  </FieldLabel>
                </FieldContent>
                <PasswordInput id="password-new" name="password" aria-invalid={!!state.fieldErrors?.password} autoComplete="new-password" />
                <FieldError>{state.fieldErrors?.password}</FieldError>
              </Field>
              <Field data-invalid={!!state.fieldErrors?.confirmPassword}>
                <FieldContent>
                  <FieldLabel htmlFor="password-confirm" required>
                    Confirmar nueva contraseña
                  </FieldLabel>
                </FieldContent>
                <PasswordInput
                  id="password-confirm"
                  name="confirmPassword"
                  aria-invalid={!!state.fieldErrors?.confirmPassword}
                  autoComplete="new-password"
                />
                <FieldError>{state.fieldErrors?.confirmPassword}</FieldError>
              </Field>
            </FieldGroup>
          </fieldset>
          <DialogFooter className="-mx-5 -mb-5 p-3.5">
            <Button type="button" variant="outline" size="lg" disabled={isPending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Cambiando..." : "Cambiar contraseña"}
            </Button>
          </DialogFooter>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
