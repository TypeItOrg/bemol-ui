"use client";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";

import { useGuardianWorkspace } from "@features/guardian-workspace/components/guardian-workspace-provider";

export default function ErrorPage() {
  const own = useGuardianWorkspace().profiles.find((profile) => profile.self);

  return (
    <div className="space-y-4 p-6">
      <Alert variant="destructive">
        <AlertTitle>No se pudo abrir este perfil</AlertTitle>
        <AlertDescription>
          La vinculación puede haber finalizado o el servicio no está disponible. No se cambió tu perfil automáticamente.
        </AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link href={own ? `/self-service/${own.personId}` : "/"}>Volver a mi perfil</Link>
      </Button>
    </div>
  );
}
