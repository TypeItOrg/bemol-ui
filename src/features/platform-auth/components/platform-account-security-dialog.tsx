"use client";

import { useActionState, useEffect, useRef, type ReactElement } from "react";

import { KeyRoundIcon, MailIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { PasswordInput } from "@common/components/ui/password-input";
import { getValidationActionState } from "@common/utils/action-state.util";

import { useWebAuthnSupport } from "@features/institutional-auth/hooks/use-webauthn-support.hook";
import { getPasskeyAssertion, isUserCancelled, toPublicKeyRequestOptions } from "@features/institutional-auth/utils/passkey-authentication.util";
import { changeOwnPlatformPasswordAction, requestOwnPlatformEmailChangeAction } from "@features/platform-auth/actions/platform-account.actions";
import { beginPlatformPasskeyReauth, finishPlatformPasskeyReauth } from "@features/platform-auth/actions/platform-passkey.actions";
import { platformEmailSchema, platformPasswordSchema } from "@features/platform-auth/schemas/platform-account.schema";
import type { PlatformSelfAccountActionState } from "@features/platform-auth/types/platform-self-account-action-state.types";

type PlatformAccountSecurityDialogProps = {
  section: "email" | "password";
  email?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

const FIELDS = ["email", "currentPassword", "password", "confirmPassword"] as const;

const PASSWORD_FIELDS = [
  { name: "currentPassword", id: "own-platform-current-password", label: "Contraseña actual", autoComplete: "current-password" },
  { name: "password", id: "own-platform-new-password", label: "Nueva contraseña", autoComplete: "new-password" },
  { name: "confirmPassword", id: "own-platform-confirm-password", label: "Confirmar nueva contraseña", autoComplete: "new-password" },
] as const;

export function PlatformAccountSecurityDialog({ section, email, onClose, onSuccess }: PlatformAccountSecurityDialogProps): ReactElement {
  const supported = useWebAuthnSupport();

  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const [state, action, pending] = useActionState<PlatformSelfAccountActionState, FormData>(async (previous, formData) => {
    const values = Object.fromEntries(FIELDS.map((field) => [field, formData.get(field)]));

    const parsed = (section === "email" ? platformEmailSchema : platformPasswordSchema).safeParse(values);

    if (!parsed.success) {
      return getValidationActionState(parsed.error.issues, FIELDS);
    }

    try {
      controller.current = new AbortController();

      const options = await beginPlatformPasskeyReauth(section);

      const credential = await getPasskeyAssertion(toPublicKeyRequestOptions(options.options), controller.current.signal);

      const verified = await finishPlatformPasskeyReauth(options.ceremonyId, credential);

      if (!verified.success) {
        return { error: verified.error ?? "No se pudo confirmar tu identidad. Intentá nuevamente." };
      }
    } catch (error) {
      return {
        error: isUserCancelled(error)
          ? "No se realizó el cambio. Confirmá tu identidad con una llave de acceso para continuar."
          : "No se pudo usar tu llave de acceso. Intentá nuevamente.",
      };
    }

    const result = await (section === "email" ? requestOwnPlatformEmailChangeAction : changeOwnPlatformPasswordAction)(previous, formData);

    if (result.success) {
      onSuccess?.();
    }

    return result;
  }, {});

  const isEmail = section === "email";

  const Icon = isEmail ? MailIcon : KeyRoundIcon;

  const submitLabel = isEmail ? "Verificar nuevo correo" : "Cambiar contraseña";

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
          document.getElementById(isEmail ? "change-platform-email" : "change-platform-password")?.focus({ preventScroll: true });
        }}
      >
        <ActionForm action={action}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <Icon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">{isEmail ? "Cambiar correo electrónico" : "Cambiar contraseña"}</DialogTitle>
            <DialogDescription className="max-w-sm text-center text-balance">
              {isEmail
                ? "Te enviaremos un enlace a la nueva dirección para verificarla. También avisaremos al correo actual."
                : "Al confirmar el cambio se cerrarán las sesiones en todos tus dispositivos."}
            </DialogDescription>
          </DialogHeader>
          {supported === false ? (
            <p className="text-muted-foreground mt-4 text-sm" role="status">
              Para continuar, usá un navegador compatible con llaves de acceso.
            </p>
          ) : null}
          {state.error ? (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription role="alert">{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <fieldset disabled={pending} className="mt-5 min-w-0">
            <FieldGroup className="gap-4">
              {isEmail ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="own-platform-current-email">Correo actual</FieldLabel>
                    <Input id="own-platform-current-email" type="email" value={email ?? ""} readOnly className="bg-muted/50" />
                  </Field>
                  <Field data-invalid={!!state.fieldErrors?.email}>
                    <FieldLabel htmlFor="own-platform-email" required>
                      Nuevo correo electrónico
                    </FieldLabel>
                    <Input
                      id="own-platform-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={150}
                      aria-invalid={!!state.fieldErrors?.email}
                    />
                    <FieldError>{state.fieldErrors?.email}</FieldError>
                  </Field>
                </>
              ) : (
                PASSWORD_FIELDS.map((field) => (
                  <Field key={field.name} data-invalid={!!state.fieldErrors?.[field.name]}>
                    <FieldLabel htmlFor={field.id} required>
                      {field.label}
                    </FieldLabel>
                    <PasswordInput
                      id={field.id}
                      name={field.name}
                      autoComplete={field.autoComplete}
                      maxLength={255}
                      aria-invalid={!!state.fieldErrors?.[field.name]}
                    />
                    <FieldError>{state.fieldErrors?.[field.name]}</FieldError>
                  </Field>
                ))
              )}
            </FieldGroup>
          </fieldset>
          <DialogFooter className="-mx-5 mt-5 -mb-5 p-3.5">
            <Button variant="outline" onClick={onClose} size="lg" disabled={pending} type="button">
              Cancelar
            </Button>
            <Button disabled={pending || supported !== true} size="lg" type="submit">
              {pending ? "Confirmando…" : submitLabel}
            </Button>
          </DialogFooter>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
