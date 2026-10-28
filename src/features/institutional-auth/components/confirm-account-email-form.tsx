"use client";

import { useActionState, type ReactElement } from "react";

import Link from "next/link";

import { ActionForm } from "@common/components/action-form";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";

import { confirmAccountEmail } from "@features/institutional-auth/actions/confirm-account-email.action";

export function ConfirmAccountEmailForm({ token }: { token: string }): ReactElement {
  const [state, action, pending] = useActionState(confirmAccountEmail, {});

  return (
    <ActionForm action={action} className="space-y-5">
      <h1 className="text-2xl font-bold">Confirmar correo de acceso</h1>
      <p className="text-muted-foreground text-sm">
        Al confirmar, este será tu correo de acceso y recuperación. Se cerrarán las sesiones personales anteriores.
      </p>
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription role="alert">{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <p role="status">Correo confirmado. Ya podés volver a iniciar sesión.</p>
      ) : (
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Confirmando…" : "Confirmar correo"}
        </Button>
      )}
      <Link className="text-primary block text-sm underline underline-offset-4" href="/auth/login">
        Iniciar sesión
      </Link>
    </ActionForm>
  );
}
