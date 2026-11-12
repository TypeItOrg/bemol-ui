import type { ReactElement } from "react";

import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { isHttpResponseError } from "@common/utils/http-response-error.util";

export function EnrollmentFormFeedback({ error }: { error: unknown }): ReactElement | null {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{isHttpResponseError(error, 409) ? "Los datos cambiaron" : "No se pudo completar la operación"}</AlertTitle>
      <AlertDescription>
        {error instanceof Error ? error.message : String(error)}
        {isHttpResponseError(error, 409) ? " Tus cambios se conservan. Revisá la versión actual antes de volver a guardar." : ""}
      </AlertDescription>
    </Alert>
  );
}
