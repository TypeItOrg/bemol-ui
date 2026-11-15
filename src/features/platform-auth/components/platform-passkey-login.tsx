"use client";

import { useActionState, useEffect, useRef, useState, type ReactElement } from "react";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";
import { useAuthRateLimit } from "@common/hooks/use-auth-rate-limit";

import { InstitutionalBrandIdentity } from "@features/institutional-auth/components/institutional-brand-identity";
import { getPasskeyAssertion, isUserCancelled, toPublicKeyRequestOptions } from "@features/institutional-auth/utils/passkey-authentication.util";
import { createPasskeyCredential, toPublicKeyCreationOptions } from "@features/institutional-auth/utils/passkey-registration.util";
import { beginPlatformPasskey, finishPlatformPasskey } from "@features/platform-auth/actions/platform-passkey.actions";
import type { PlatformLoginChallenge } from "@features/platform-auth/types/platform-login-challenge.types";
import type { PlatformPasskeyCeremonyMode } from "@features/platform-auth/types/platform-passkey-ceremony-mode.types";
import { getPlatformPasskeyLoginCopy } from "@features/platform-auth/utils/platform-passkey-login-copy.util";

type PasskeyLoginFormState = {
  mode: PlatformPasskeyCeremonyMode;
  message: string;
};

export function PlatformPasskeyLogin({ challenge, next }: { challenge: PlatformLoginChallenge; next?: string }): ReactElement {
  const [mode, setMode] = useState<PlatformPasskeyCeremonyMode>(challenge.setupRequired ? "setup" : "verify");

  const rateLimit = useAuthRateLimit();

  const controller = useRef<AbortController | null>(null);

  const isRegistration = mode !== "verify";

  const [formState, action, pending] = useActionState<PasskeyLoginFormState, FormData>(
    async (_previous, data) => {
      if (rateLimit.rateLimited) {
        return { mode, message: "" };
      }

      controller.current = new AbortController();

      const fail = (text: string): PasskeyLoginFormState => ({
        mode,
        message: rateLimit.handleError(new Error(text)) ? RATE_LIMIT_ERROR_MESSAGE : text,
      });

      try {
        const optionsResult = await beginPlatformPasskey(
          challenge.loginAttemptId,
          isRegistration ? { mode, code: String(data.get("code") ?? "").trim(), label: String(data.get("label") ?? "").trim() } : undefined,
        );

        if ("error" in optionsResult) {
          return fail(optionsResult.error);
        }

        const credential = isRegistration
          ? await createPasskeyCredential(toPublicKeyCreationOptions(optionsResult.options), controller.current.signal)
          : await getPasskeyAssertion(toPublicKeyRequestOptions(optionsResult.options), controller.current.signal);

        const finishResult = await finishPlatformPasskey(optionsResult.ceremonyId, credential, mode, next);

        if (finishResult?.error) {
          return fail(finishResult.error);
        }

        return { mode, message: "" };
      } catch (cause) {
        if (rateLimit.handleError(cause)) {
          return { mode, message: RATE_LIMIT_ERROR_MESSAGE };
        }

        return {
          mode,
          message: isUserCancelled(cause)
            ? "No se completó la verificación. Podés intentarlo nuevamente."
            : "No se pudo completar el acceso. Verificá el código o volvé a iniciar sesión si venció el intento.",
        };
      }
    },
    { mode, message: "" },
  );

  useEffect(() => () => controller.current?.abort(), []);

  const { title, description, submitLabel } = getPlatformPasskeyLoginCopy(mode, challenge.setupRequired);

  const displayedError = rateLimit.getErrorMessage(formState.mode === mode ? formState.message : "");

  return (
    <form action={action} className="flex flex-col justify-center p-6 md:p-8">
      <header className="space-y-1 text-center">
        <InstitutionalBrandIdentity
          className="mb-3 w-full md:hidden"
          imageContainerClassName="h-20 sm:h-24 w-full"
          imageClassName="max-h-20 max-w-56 sm:max-h-24 sm:max-w-64"
        />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm text-balance">{description}</p>
      </header>

      <div className="mt-6 space-y-6">
        {displayedError ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>¡Ups! Algo salió mal</AlertTitle>
            <AlertDescription>{displayedError}</AlertDescription>
          </Alert>
        ) : null}

        {isRegistration ? (
          <>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="platform-setup-code">{mode === "enroll" ? "Código de vinculación" : "Código temporal"}</FieldLabel>
                <Input
                  autoComplete="off"
                  autoCapitalize="characters"
                  disabled={pending}
                  id="platform-setup-code"
                  name="code"
                  required
                  maxLength={100}
                  spellCheck={false}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="platform-key-label">Nombre de la llave</FieldLabel>
                <Input
                  disabled={pending}
                  id="platform-key-label"
                  name="label"
                  required
                  maxLength={100}
                  placeholder={mode === "enroll" ? "Mi teléfono" : "Mi computadora"}
                />
              </Field>
            </FieldGroup>
          </>
        ) : null}

        <footer className="mt-6 flex w-full flex-col gap-2">
          <Button aria-busy={pending} className="w-full" disabled={pending || rateLimit.rateLimited} size="lg" type="submit">
            {pending ? <Loader2Icon aria-hidden="true" className="size-4 animate-spin" /> : null}
            {pending ? "Verificando…" : submitLabel}
          </Button>
          <Button className="w-full" disabled={pending} onClick={() => window.location.reload()} size="lg" type="button" variant="outline">
            Volver a iniciar sesión
          </Button>
        </footer>

        {!challenge.setupRequired ? (
          <p className="text-muted-foreground text-center text-sm">
            {mode === "verify" ? (
              <>
                ¿Sin tu llave de acceso? Usá un{" "}
                <Button className="h-auto p-0" disabled={pending} onClick={() => setMode("enroll")} type="button" variant="link">
                  código de vinculación
                </Button>{" "}
                o{" "}
                <Button className="h-auto p-0" disabled={pending} onClick={() => setMode("setup")} type="button" variant="link">
                  recuperá tu acceso
                </Button>
                .
              </>
            ) : (
              <>
                ¿Ya tenés una llave?{" "}
                <Button className="h-auto p-0" disabled={pending} onClick={() => setMode("verify")} type="button" variant="link">
                  Usar llave de acceso
                </Button>
              </>
            )}
          </p>
        ) : null}
      </div>
    </form>
  );
}
