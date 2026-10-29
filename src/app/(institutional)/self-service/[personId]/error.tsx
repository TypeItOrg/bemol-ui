"use client";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { useApiUnavailableRedirect } from "@common/hooks/use-api-unavailable-redirect";

import { RestoreOwnIdentityForm } from "@features/guardian-workspace/components/restore-own-identity-form";

export default function ErrorPage() {
  useApiUnavailableRedirect();

  return (
    <div className="space-y-4 p-6">
      <Alert variant="destructive">
        <AlertTitle>No se pudo abrir este perfil</AlertTitle>
        <AlertDescription>
          La vinculación puede haber finalizado o el servicio no está disponible. No se cambió tu perfil automáticamente.
        </AlertDescription>
      </Alert>
      <RestoreOwnIdentityForm />
    </div>
  );
}
