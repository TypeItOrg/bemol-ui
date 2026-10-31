"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactElement, type SyntheticEvent } from "react";

import { CircleAlertIcon, ShieldCheckIcon } from "lucide-react";

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
import { PasswordInput } from "@common/components/ui/password-input";

import { reAuthenticateAction } from "@features/institutional-auth/actions/passkey-management.actions";
import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";
import type { ReAuthenticateState } from "@features/institutional-auth/types/re-authenticate-state.types";
import { getPasskeyAssertion, isUserCancelled, toPublicKeyRequestOptions } from "@features/institutional-auth/utils/passkey-authentication.util";
import { beginPlatformPasskeyReauth, finishPlatformPasskeyReauth } from "@features/platform-auth/actions/platform-passkey.actions";

type PasskeyReauthDialogProps = {
  platform?: boolean;
  target?: string;
  onClose: () => void;
  onVerified: () => Promise<ReAuthenticateState>;
};

export function PasskeyReauthDialog({ onClose, onVerified, platform = false, target = "register" }: PasskeyReauthDialogProps): ReactElement {
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const [state, action, isPending] = useActionState<ReAuthenticateState, FormData>(async (previous, formData) => {
    try {
      let result: ReAuthenticateState;

      if (platform) {
        controller.current = new AbortController();

        const options = await beginPlatformPasskeyReauth(target);

        const credential = await getPasskeyAssertion(toPublicKeyRequestOptions(options.options), controller.current.signal);

        result = await finishPlatformPasskeyReauth(options.ceremonyId, credential);
      } else {
        result = await reAuthenticateAction(previous, formData);
      }

      if (!result.success) {
        return result;
      }

      return await onVerified();
    } catch (error) {
      if (isUserCancelled(error)) {
        return {};
      }

      return { error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.PASSKEY_OPERATION_FAILED };
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

  const error = state.fieldErrors?.password ?? state.error;

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
              <ShieldCheckIcon aria-hidden="true" className="size-6" />
            </div>
            <AlertDialogTitle>Confirmá tu identidad</AlertDialogTitle>
            <AlertDialogDescription>
              {platform
                ? "Usá una de tus llaves de acceso para autorizar este cambio."
                : "Ingresá tu contraseña para continuar. Esta confirmación es válida por unos minutos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!platform ? (
            <Field className="mt-5" data-invalid={!!error}>
              <FieldLabel htmlFor="reauth-password" required>
                Contraseña
              </FieldLabel>
              <PasswordInput autoComplete="current-password" disabled={isPending} id="reauth-password" name="password" />
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
          {platform && error ? (
            <Alert className="mt-4" variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel disabled={isPending} size="lg" type="button">
              Cancelar
            </AlertDialogCancel>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending ? "Confirmando…" : "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
