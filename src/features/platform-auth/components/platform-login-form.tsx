"use client";

import { useActionState, useState, type ReactElement } from "react";

import { AlertCircleIcon, CircleCheckIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { PasswordInput } from "@common/components/ui/password-input";
import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";
import { useAuthRateLimit } from "@common/hooks/use-auth-rate-limit";
import { getValidationActionState } from "@common/utils/action-state.util";
import { cn } from "@common/utils/cn.util";

import { InstitutionalBrandIdentity } from "@features/institutional-auth/components/institutional-brand-identity";
import { loginPlatform } from "@features/platform-auth/actions/platform-login.action";
import { PlatformPasskeyLogin } from "@features/platform-auth/components/platform-passkey-login";
import { platformLoginSchema } from "@features/platform-auth/schemas/platform-login.schema";
import type { PlatformLoginActionState } from "@features/platform-auth/types/platform-login-action-state.types";
import { PLATFORM_LOGIN_FIELD_NAMES } from "@features/platform-auth/types/platform-login-field-name.types";

const INITIAL_STATE: PlatformLoginActionState = {};

export function PlatformLoginForm({ next, accountUpdated = false }: { next?: string; accountUpdated?: boolean }): ReactElement {
  const rateLimit = useAuthRateLimit();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [state, formAction, isPending] = useActionState<PlatformLoginActionState, FormData>(async (previous, data) => {
    if (rateLimit.rateLimited) {
      return previous;
    }

    const parsed = platformLoginSchema.safeParse({ email: data.get("email"), password: data.get("password") });

    if (!parsed.success) {
      return getValidationActionState(parsed.error.issues, PLATFORM_LOGIN_FIELD_NAMES);
    }

    try {
      return await loginPlatform(previous, data);
    } catch (error) {
      if (rateLimit.handleError(error)) {
        return { error: RATE_LIMIT_ERROR_MESSAGE };
      }

      throw error;
    }
  }, INITIAL_STATE);

  const displayedError = rateLimit.getErrorMessage(state.error);

  if (state.challenge) {
    return <PlatformPasskeyLogin challenge={state.challenge} next={next} />;
  }

  return (
    <form action={formAction} noValidate className="flex flex-col justify-center p-6 md:p-8">
      <input type="hidden" name="next" value={next ?? ""} />
      <header className="space-y-1 text-center">
        <InstitutionalBrandIdentity
          className="mb-3 w-full md:hidden"
          imageContainerClassName="h-20 sm:h-24 w-full"
          imageClassName="max-h-20 max-w-56 sm:max-h-24 sm:max-w-64"
        />
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="text-muted-foreground text-sm">
          <span className="hidden md:block">Ingresá tus credenciales para acceder a tu cuenta.</span>
          <span className="md:hidden">Ingresá tus credenciales para continuar.</span>
        </p>
      </header>

      <div className="mt-6 space-y-6">
        {accountUpdated ? (
          <Alert variant="success" role="status">
            <CircleCheckIcon aria-hidden="true" />
            <AlertDescription>Tu cuenta se actualizó y se cerraron todas tus sesiones. Ingresá con tus credenciales actuales.</AlertDescription>
          </Alert>
        ) : null}
        {displayedError ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>¡Ups! Algo salió mal</AlertTitle>
            <AlertDescription>{displayedError}</AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
            <Input
              aria-invalid={!!state.fieldErrors?.email}
              autoComplete="email"
              id="email"
              name="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FieldError errors={state.fieldErrors?.email ? [{ message: state.fieldErrors.email }] : undefined} />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <PasswordInput
              aria-invalid={!!state.fieldErrors?.password}
              autoComplete="current-password"
              id="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldError errors={state.fieldErrors?.password ? [{ message: state.fieldErrors.password }] : undefined} />
          </Field>
        </FieldGroup>

        <footer className="mt-6 flex w-full flex-col gap-4">
          <Button
            aria-busy={isPending}
            className="relative w-full"
            disabled={isPending || rateLimit.rateLimited}
            size="lg"
            type="submit"
            variant="default"
          >
            <span className={cn("inline-flex items-center gap-[inherit] transition-opacity", isPending && "opacity-0")}>Iniciar sesión</span>
            {isPending ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit]">
                <Loader2Icon aria-hidden="true" className="animate-spin" />
                <span className="sr-only" role="status" aria-live="polite">
                  Ingresando...
                </span>
              </span>
            ) : null}
          </Button>
        </footer>
      </div>
    </form>
  );
}
