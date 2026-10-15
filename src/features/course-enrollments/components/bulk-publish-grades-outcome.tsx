"use client";

import type { ReactElement } from "react";

import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";

import type { BulkPublishResult } from "@features/course-enrollments/actions/publish-bulk-grades.actions";

export function BulkPublishOutcome({ state }: { state: BulkPublishResult }): ReactElement {
  const failed = state.failedClasses ?? 0;

  const uncertain = state.uncertainClasses ?? 0;

  const published = state.publishedClasses ?? 0;

  const showError = state.error && published === 0;

  const showDetails = published > 0 || failed > 0 || uncertain > 0;

  return (
    <>
      {showError ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {showDetails ? (
        <Alert variant={failed > 0 || uncertain > 0 ? "destructive" : "default"}>
          <CircleAlertIcon />
          <AlertDescription>
            {published > 0 ? `Se publicaron ${published} clases. ` : ""}
            {failed > 0 ? `${failed} fallaron. ` : ""}
            {uncertain > 0 ? `${uncertain} requieren verificar el estado antes de reintentar.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
