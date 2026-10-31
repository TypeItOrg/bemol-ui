"use client";

import { startTransition, useActionState, type ReactElement, type SyntheticEvent } from "react";

import { CircleAlertIcon, Trash2Icon } from "lucide-react";

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

import { revokePasskeyAction } from "@features/institutional-auth/actions/passkey-management.actions";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import { RECENT_AUTH_REQUIRED } from "@features/institutional-auth/constants/passkey.constants";
import type { Passkey } from "@features/institutional-auth/types/passkey.types";
import type { RevokePasskeyState } from "@features/institutional-auth/types/revoke-passkey-state.types";
import { revokePlatformPasskey } from "@features/platform-auth/actions/platform-passkey.actions";

type PasskeyRevokeDialogProps = {
  platform?: boolean;
  passkey: Passkey;
  onClose: () => void;
  onSuccess: () => void;
  onRequireReauth: () => void;
};

export function PasskeyRevokeDialog({ passkey, onClose, onSuccess, onRequireReauth, platform = false }: PasskeyRevokeDialogProps): ReactElement {
  const [state, action, isPending] = useActionState<RevokePasskeyState>(async () => {
    try {
      const result = await (platform ? revokePlatformPasskey : revokePasskeyAction)(passkey.id);

      if (result.error === RECENT_AUTH_REQUIRED) {
        onRequireReauth();
      } else if (result.success) {
        onSuccess();
      }

      return result;
    } catch {
      return { error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_REVOKE_FAILED };
    }
  }, {});

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (isPending) {
      return;
    }

    startTransition(() => action());
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
              <Trash2Icon aria-hidden="true" className="size-6" />
            </div>
            <AlertDialogTitle>¿Eliminar llave de acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <span className="text-foreground font-semibold">{passkey.label}</span>.{" "}
              {platform
                ? "Se cerrarán tus sesiones y necesitarás otra llave para volver a ingresar."
                : "Podrás seguir ingresando con tu contraseña u otras llaves de acceso."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel disabled={isPending} size="lg" type="button">
              Cancelar
            </AlertDialogCancel>
            <Button disabled={isPending} size="lg" type="submit" variant="destructive">
              {isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
