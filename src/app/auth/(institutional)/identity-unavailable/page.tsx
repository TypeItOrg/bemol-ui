import type { ReactElement } from "react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";

import { RestoreOwnIdentityForm } from "@features/guardian-workspace/components/restore-own-identity-form";

export default function IdentityUnavailablePage(): ReactElement {
  return (
    <section className="mx-auto max-w-md space-y-4">
      <Alert variant="destructive">
        <AlertTitle>La identidad activa no está disponible</AlertTitle>
        <AlertDescription>
          La vinculación puede haber finalizado o la institución puede haber bloqueado el acceso. Volvé a tu identidad para continuar.
        </AlertDescription>
      </Alert>
      <RestoreOwnIdentityForm />
    </section>
  );
}
