"use client";

import { useActionState, useEffect, useRef, useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogTrigger } from "@common/components/ui/dialog";
import { getValidationActionState } from "@common/utils/action-state.util";
import { getSafeReturnTo } from "@common/utils/return-to.util";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { saveEnrollmentPdfSettingsAction } from "@features/enrollment-pdf/actions/save-enrollment-pdf-settings.action";
import { EnrollmentPdfSettingsFields } from "@features/enrollment-pdf/components/enrollment-pdf-settings-fields";
import { EnrollmentPdfSettingsPreview } from "@features/enrollment-pdf/components/enrollment-pdf-settings-preview";
import { ENROLLMENT_PDF_FIELDS, ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import { parseEnrollmentPdfSettingsForm } from "@features/enrollment-pdf/schemas/enrollment-pdf-settings.schema";
import type { EnrollmentPdfActionState } from "@features/enrollment-pdf/types/enrollment-pdf-action-state.types";
import type { EnrollmentPdfScope } from "@features/enrollment-pdf/types/enrollment-pdf-scope.types";
import type { EnrollmentPdfSettings } from "@features/enrollment-pdf/types/enrollment-pdf-settings.types";
import { readEnrollmentPdfResponse } from "@features/enrollment-pdf/utils/read-enrollment-pdf-response.util";

export function EnrollmentPdfSettingsForm({
  institutionId,
  scope,
  settings,
  returnTo,
}: {
  institutionId: string;
  scope: EnrollmentPdfScope;
  settings: EnrollmentPdfSettings;
  returnTo: string;
}): ReactElement {
  const router = useRouter();

  const destination = getSafeReturnTo(returnTo, scope === "platform" ? `/institutions/${institutionId}` : "/institution");

  const formRef = useRef<HTMLFormElement>(null);

  const previewRequest = useRef<AbortController | null>(null);

  const [values, setValues] = useState(settings);

  const [previewSource, setPreviewSource] = useState<string>();

  const [previewOpen, setPreviewOpen] = useState(false);

  const [previewPending, setPreviewPending] = useState(false);

  const [previewError, setPreviewError] = useState<string>();

  const [validation, setValidation] = useState<EnrollmentPdfActionState>({});

  const [state, formAction, pending] = useActionState<EnrollmentPdfActionState, FormData>(async (previous, form) => {
    const result = await safelyRunAction(saveEnrollmentPdfSettingsAction(scope, institutionId, previous, form), ENROLLMENT_PDF_MESSAGES.save);

    setValidation(result);

    if (result.success) {
      router.push(destination);
    }

    return result;
  }, {});

  useEffect(() => () => previewRequest.current?.abort(), []);
  useEffect(
    () => () => {
      if (previewSource) {
        URL.revokeObjectURL(previewSource);
      }
    },
    [previewSource],
  );

  const errors = validation.fieldErrors ?? {};

  function setField<K extends keyof EnrollmentPdfSettings>(field: K, value: EnrollmentPdfSettings[K]): void {
    setValues((current) => ({ ...current, [field]: value }));
    setValidation((current) => ({ fieldErrors: { ...current.fieldErrors, [field]: undefined } }));
  }

  function changePreviewOpen(open: boolean): void {
    setPreviewOpen(open);

    if (!open) {
      previewRequest.current?.abort();
      setPreviewSource(undefined);
      setPreviewError(undefined);
      setPreviewPending(false);
    }
  }

  async function preview(): Promise<void> {
    if (!formRef.current) {
      return;
    }

    const parsed = parseEnrollmentPdfSettingsForm(new FormData(formRef.current));

    if (!parsed.success) {
      setValidation(getValidationActionState(parsed.error.issues, ENROLLMENT_PDF_FIELDS));

      return;
    }

    previewRequest.current = new AbortController();

    const { signal } = previewRequest.current;

    const prefix = scope === "platform" ? "/api/admin" : "/api/institutional";

    setPreviewPending(true);
    setPreviewOpen(true);
    setPreviewError(undefined);
    setValidation({});

    try {
      const response = await fetch(`${prefix}/institutions/${institutionId}/enrollment-pdf-settings/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        cache: "no-store",
        signal,
      });

      const blob = await readEnrollmentPdfResponse(response, ENROLLMENT_PDF_MESSAGES.preview);

      if (!signal.aborted) {
        setPreviewSource(URL.createObjectURL(blob));
      }
    } catch (failure) {
      if (!signal.aborted) {
        setPreviewError(failure instanceof Error ? failure.message : ENROLLMENT_PDF_MESSAGES.preview);
      }
    } finally {
      if (!signal.aborted) {
        setPreviewPending(false);
      }
    }
  }

  return (
    <Dialog open={previewOpen} onOpenChange={changePreviewOpen}>
      <form ref={formRef} action={formAction} className="flex min-w-0 flex-col gap-6" noValidate>
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="lg" disabled={pending || previewPending} onClick={() => router.push(destination)}>
            Volver
          </Button>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="lg"
              disabled={pending || previewPending}
              aria-busy={previewPending}
              onClick={(event) => {
                // Validate before opening the dialog.
                event.preventDefault();
                void preview();
              }}
            >
              {previewPending ? "Generando…" : "Vista previa"}
            </Button>
          </DialogTrigger>
        </div>
        {state.error ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        <EnrollmentPdfSettingsFields values={values} errors={errors} disabled={pending} onChange={setField} />
        <EnrollmentPdfSettingsPreview
          source={previewSource}
          pending={previewPending}
          error={previewError}
          onError={() => {
            setPreviewError("No se pudo mostrar el PDF. Volvé a intentar la vista previa.");
            setPreviewSource(undefined);
          }}
        />
        <div className="flex flex-wrap justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none"
            disabled={pending || previewPending}
            onClick={() => router.push(destination)}
          >
            Cancelar
          </Button>
          <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={pending || previewPending} aria-busy={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
