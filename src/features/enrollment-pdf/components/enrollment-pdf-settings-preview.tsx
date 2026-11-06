"use client";

import type { ReactElement } from "react";

import { CircleAlertIcon, FileTextIcon, LoaderCircleIcon, XIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@common/components/ui/dialog";

import { DocumentPdfPreview } from "@features/enrollment-applications/components/document-pdf-preview";

export function EnrollmentPdfSettingsPreview({
  source,
  pending,
  error,
  onError,
}: {
  source?: string;
  pending: boolean;
  error?: string;
  onError: () => void;
}): ReactElement {
  return (
    <DialogContent
      showCloseButton={false}
      className="h-[min(52rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[min(64rem,calc(100%-2rem))]"
    >
      <div className="flex min-w-0 items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
          <FileTextIcon className="size-5" aria-hidden="true" />
        </div>
        <DialogHeader className="min-w-0 flex-1 gap-1">
          <DialogTitle className="leading-snug">Vista previa de la planilla</DialogTitle>
          <DialogDescription>Ejemplo con datos ficticios, sin guardar los cambios.</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon-lg" className="size-11 shrink-0" aria-label="Cerrar vista previa">
            <XIcon aria-hidden="true" />
          </Button>
        </DialogClose>
      </div>
      <div className="bg-muted/40 min-h-0 overflow-hidden border-t p-3 sm:p-5">
        {pending ? (
          <div role="status" className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 text-sm">
            <LoaderCircleIcon className="size-6 animate-spin" aria-hidden="true" />
            Generando vista previa…
          </div>
        ) : null}
        {!pending && error ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>No se pudo generar la vista previa</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {!pending && !error && source ? <DocumentPdfPreview src={source} name="Ejemplo con datos ficticios" expanded onError={onError} /> : null}
      </div>
    </DialogContent>
  );
}
