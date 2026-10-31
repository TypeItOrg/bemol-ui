"use client";

import { startTransition, useActionState, type ReactElement, type SyntheticEvent } from "react";

import { PencilIcon } from "lucide-react";

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

import { renamePasskeyAction } from "@features/institutional-auth/actions/passkey-management.actions";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import type { Passkey } from "@features/institutional-auth/types/passkey.types";
import type { RenamePasskeyState } from "@features/institutional-auth/types/rename-passkey-state.types";
import { renamePlatformPasskey } from "@features/platform-auth/actions/platform-passkey.actions";

type PasskeyRenameDialogProps = { platform?: boolean; passkey: Passkey; onClose: () => void; onSuccess: () => void };

export function PasskeyRenameDialog({ passkey, onClose, onSuccess, platform = false }: PasskeyRenameDialogProps): ReactElement {
  const [state, action, isPending] = useActionState<RenamePasskeyState, FormData>(async (previous, formData) => {
    try {
      const result = await (platform ? renamePlatformPasskey : renamePasskeyAction)(passkey.id, previous, formData);

      if (result.success) {
        onSuccess();
      }

      return result;
    } catch {
      return { error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_RENAME_FAILED };
    }
  }, {});

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(() => action(formData));
  }

  const error = state.fieldErrors?.label ?? state.error;

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
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <PencilIcon aria-hidden="true" className="size-6" />
            </div>
            <AlertDialogTitle>Renombrar llave de acceso</AlertDialogTitle>
            <AlertDialogDescription>Usá un nombre que te ayude a identificar el dispositivo donde la guardaste.</AlertDialogDescription>
          </AlertDialogHeader>
          <Field className="mt-5" data-invalid={!!error}>
            <FieldLabel htmlFor="passkey-rename" required>
              Nombre
            </FieldLabel>
            <Input disabled={isPending} id="passkey-rename" name="label" maxLength={100} defaultValue={passkey.label} />
            <FieldError>{error}</FieldError>
          </Field>
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel disabled={isPending} size="lg" type="button">
              Cancelar
            </AlertDialogCancel>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
