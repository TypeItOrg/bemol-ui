"use client";

import { useActionState, type ReactElement } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { UserRoundIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";

import { updateOwnPlatformProfileAction } from "@features/platform-auth/actions/platform-account.actions";
import type { PlatformAccount } from "@features/platform-auth/types/platform-account.types";
import type { PlatformSelfAccountActionState } from "@features/platform-auth/types/platform-self-account-action-state.types";
import { platformAccountKeys } from "@features/platform-auth/utils/platform-account-keys.util";

type PlatformProfileDialogProps = { account: PlatformAccount; onClose: () => void; onSuccess: () => void };

export function PlatformProfileDialog({ account, onClose, onSuccess }: PlatformProfileDialogProps): ReactElement {
  const queryClient = useQueryClient();

  const [state, action, pending] = useActionState<PlatformSelfAccountActionState, FormData>(async (previous, formData) => {
    const result = await updateOwnPlatformProfileAction(previous, formData);

    if (result.success) {
      void queryClient.invalidateQueries({ queryKey: platformAccountKeys.byAccount(account.platformAccountId) });
      onSuccess();
    }

    return result;
  }, {});

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] gap-3.5 overflow-y-auto p-5"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("edit-platform-profile")?.focus({ preventScroll: true });
        }}
      >
        <ActionForm action={action}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <UserRoundIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Editar datos personales</DialogTitle>
            <DialogDescription className="text-center text-balance">Actualizá tu nombre y apellido.</DialogDescription>
          </DialogHeader>
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription role="alert">{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <fieldset disabled={pending} className="mt-5 min-w-0">
            <FieldGroup className="gap-4">
              <Field data-invalid={!!state.fieldErrors?.name}>
                <FieldLabel htmlFor="own-platform-name" required>
                  Nombre
                </FieldLabel>
                <Input
                  id="own-platform-name"
                  name="name"
                  defaultValue={account.name}
                  autoComplete="given-name"
                  maxLength={255}
                  aria-invalid={!!state.fieldErrors?.name}
                />
                <FieldError>{state.fieldErrors?.name}</FieldError>
              </Field>
              <Field data-invalid={!!state.fieldErrors?.lastName}>
                <FieldLabel htmlFor="own-platform-last-name" required>
                  Apellido
                </FieldLabel>
                <Input
                  id="own-platform-last-name"
                  name="lastName"
                  defaultValue={account.lastName}
                  autoComplete="family-name"
                  maxLength={255}
                  aria-invalid={!!state.fieldErrors?.lastName}
                />
                <FieldError>{state.fieldErrors?.lastName}</FieldError>
              </Field>
            </FieldGroup>
          </fieldset>
          <DialogFooter className="-mx-5 mt-5 -mb-5 p-3.5">
            <Button variant="outline" onClick={onClose} size="lg" disabled={pending} type="button">
              Cancelar
            </Button>
            <Button disabled={pending} size="lg" type="submit">
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
