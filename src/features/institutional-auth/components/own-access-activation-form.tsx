"use client";

import { useActionState, type ReactElement } from "react";

import Link from "next/link";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { PasswordInput } from "@common/components/ui/password-input";

import { activateOwnAccess } from "@features/institutional-auth/actions/activate-own-access.action";
import { InstitutionalAuthDescription } from "@features/institutional-auth/components/institutional-auth-description";
import { InstitutionalAuthStepHeader } from "@features/institutional-auth/components/institutional-auth-step-header";

export function OwnAccessActivationForm({ token }: { token: string }): ReactElement {
  const [state, action, pending] = useActionState(activateOwnAccess, {});

  if (state.success) {
    return (
      <div className="flex flex-col justify-center gap-6 p-5 sm:p-8">
        <InstitutionalAuthStepHeader
          title="Cuenta activada"
          description={
            <InstitutionalAuthDescription
              generic="Tu cuenta está activa. Ya podés ingresar con tu documento y tu contraseña."
              before="Tu cuenta del portal institucional del "
              after=" está activa. Ya podés ingresar con tu documento y tu contraseña."
            />
          }
        />
        <Button asChild className="w-full" size="lg">
          <Link href="/auth/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <ActionForm action={action} className="flex flex-col justify-center p-5 sm:p-8">
      <input type="hidden" name="token" value={token} />
      <InstitutionalAuthStepHeader
        title="Activá tu cuenta"
        description={
          <InstitutionalAuthDescription
            generic="Configurá tu contraseña para acceder a tu perfil. El enlace vence en 24 horas."
            before="Configurá tu contraseña para acceder a tu perfil del portal institucional del "
            after=". El enlace vence en 24 horas."
          />
        }
      />
      <div className="mt-6 space-y-6">
        {state.error ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertCircleIcon className="size-4" aria-hidden="true" />
            <AlertTitle>¡Ups! Algo salió mal</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="activate-password" required>
              Contraseña
            </FieldLabel>
            <PasswordInput id="activate-password" name="password" autoComplete="new-password" required disabled={pending} />
          </Field>
          <Field>
            <FieldLabel htmlFor="activate-confirm" required>
              Repetir contraseña
            </FieldLabel>
            <PasswordInput id="activate-confirm" name="confirmPassword" autoComplete="new-password" required disabled={pending} />
          </Field>
        </FieldGroup>
        <Button className="w-full" size="lg" disabled={pending || !token} aria-busy={pending} type="submit">
          {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : null}
          {pending ? "Activando…" : "Activar mi cuenta"}
        </Button>
      </div>
    </ActionForm>
  );
}
