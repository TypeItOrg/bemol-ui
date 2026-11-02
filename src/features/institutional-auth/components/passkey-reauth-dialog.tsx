"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactElement, type SyntheticEvent } from "react";

import { CircleAlertIcon, ShieldCheckIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3.5 p-5">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <ShieldCheckIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Confirmá tu identidad</DialogTitle>
            <DialogDescription className="text-center text-balance">
              {platform
                ? "Usá una de tus llaves de acceso para autorizar este cambio."
                : "Ingresá tu contraseña para continuar. Esta confirmación es válida por unos minutos."}
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter className="-mx-5 mt-5 -mb-5 p-3.5">
            <Button variant="outline" onClick={onClose} disabled={isPending} size="lg" type="button">
              Cancelar
            </Button>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending ? "Confirmando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
