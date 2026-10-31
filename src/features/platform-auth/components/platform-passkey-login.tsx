"use client";

import { useActionState, useEffect, useRef, useState, type ReactElement } from "react";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";

import { InstitutionalBrandIdentity } from "@features/institutional-auth/components/institutional-brand-identity";
import { getPasskeyAssertion, isUserCancelled, toPublicKeyRequestOptions } from "@features/institutional-auth/utils/passkey-authentication.util";
import { createPasskeyCredential, toPublicKeyCreationOptions } from "@features/institutional-auth/utils/passkey-registration.util";
import { beginPlatformPasskey, finishPlatformPasskey } from "@features/platform-auth/actions/platform-passkey.actions";
import type { PlatformLoginChallenge } from "@features/platform-auth/types/platform-login-challenge.types";

export function PlatformPasskeyLogin({ challenge, next }: { challenge: PlatformLoginChallenge; next?: string }): ReactElement {
  const [setup, setSetup] = useState(challenge.setupRequired);

  const controller = useRef<AbortController | null>(null);

  const [error, action, pending] = useActionState<string, FormData>(async (_previous, data) => {
    controller.current = new AbortController();

    try {
      const options = await beginPlatformPasskey(
        challenge.loginAttemptId,
        setup
          ? {
              code: String(data.get("code") ?? "").trim(),
              label: String(data.get("label") ?? "").trim(),
            }
          : undefined,
      );

      const credential = setup
        ? await createPasskeyCredential(toPublicKeyCreationOptions(options.options), controller.current.signal)
        : await getPasskeyAssertion(toPublicKeyRequestOptions(options.options), controller.current.signal);

      await finishPlatformPasskey(options.ceremonyId, credential, setup, next);

      return "";
    } catch (cause) {
      return isUserCancelled(cause)
        ? "No se completó la verificación. Podés intentarlo nuevamente."
        : "No se pudo completar el acceso. Verificá el código o volvé a iniciar sesión si venció el intento.";
    }
  }, "");

  useEffect(() => () => controller.current?.abort(), []);

  const submitLabel = setup ? "Registrar llave e ingresar" : "Usar llave de acceso";

  return (
    <form action={action} className="flex flex-col justify-center p-6 md:p-8">
      <header className="space-y-1 text-center">
        <InstitutionalBrandIdentity
          className="mb-3 w-full md:hidden"
          imageContainerClassName="h-20 sm:h-24 w-full"
          imageClassName="max-h-20 max-w-56 sm:max-h-24 sm:max-w-64"
        />
        <h1 className="text-2xl font-bold">{setup ? "Configurá tu llave de acceso" : "Confirmá que sos vos"}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {setup
            ? "Ingresá el código temporal y registrá una llave de acceso en este dispositivo."
            : "Usá tu llave de acceso para terminar de ingresar a la administración."}
        </p>
      </header>

      <div className="mt-6 space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>¡Ups! Algo salió mal</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {setup ? (
          <>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="platform-setup-code">Código temporal</FieldLabel>
                <Input
                  autoComplete="off"
                  disabled={pending}
                  id="platform-setup-code"
                  name="code"
                  required
                  minLength={64}
                  maxLength={64}
                  spellCheck={false}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="platform-key-label">Nombre de la llave</FieldLabel>
                <Input disabled={pending} id="platform-key-label" name="label" required maxLength={100} placeholder="Mi computadora" />
              </Field>
            </FieldGroup>
          </>
        ) : null}

        <footer className="mt-6 flex w-full flex-col gap-2">
          <Button aria-busy={pending} className="w-full" disabled={pending} size="lg" type="submit">
            {pending ? <Loader2Icon aria-hidden="true" className="size-4 animate-spin" /> : null}
            {pending ? "Verificando…" : submitLabel}
          </Button>
          <Button className="w-full" disabled={pending} onClick={() => window.location.reload()} size="lg" type="button" variant="outline">
            Volver a iniciar sesión
          </Button>
          {!setup ? (
            <p className="text-muted-foreground mt-2 text-center text-sm">
              ¿No tenés tu llave de acceso?{" "}
              <button
                className="text-primary font-medium underline underline-offset-4 disabled:pointer-events-none disabled:opacity-50"
                disabled={pending}
                onClick={() => setSetup(true)}
                type="button"
              >
                Recuperar acceso
              </button>
            </p>
          ) : null}
          {setup && !challenge.setupRequired ? (
            <p className="text-muted-foreground mt-2 text-center text-sm">
              ¿Ya tenés tu llave de acceso?{" "}
              <button
                className="text-primary font-medium underline underline-offset-4 disabled:pointer-events-none disabled:opacity-50"
                disabled={pending}
                onClick={() => setSetup(false)}
                type="button"
              >
                Usarla
              </button>
            </p>
          ) : null}
        </footer>
      </div>
    </form>
  );
}
