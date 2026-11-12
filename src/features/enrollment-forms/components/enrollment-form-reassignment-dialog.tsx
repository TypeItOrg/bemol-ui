"use client";

import { useState, type FormEvent, type ReactElement } from "react";

import { ArrowLeftRightIcon } from "lucide-react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldLabel } from "@common/components/ui/field";

import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { ENROLLMENT_VERSION_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import { enrollmentFormQueryKey, useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import { fetchEnrollmentFormModelPage, fetchEnrollmentFormVersionPage } from "@features/enrollment-forms/services/enrollment-form-client.service";
import type { EnrollmentFormAssignment } from "@features/enrollment-forms/types/enrollment-form-assignment.types";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormModel } from "@features/enrollment-forms/types/enrollment-form-model.types";
import type { EnrollmentFormVersionSummary } from "@features/enrollment-forms/types/enrollment-form-version-summary.types";
import { getEnrollmentFormVersionLabel } from "@features/enrollment-forms/utils/enrollment-form-version-label.util";

export function EnrollmentFormReassignmentDialog({
  context,
  assignment,
  onClose,
}: {
  context: EnrollmentFormContext;
  assignment: EnrollmentFormAssignment;
  onClose: () => void;
}): ReactElement {
  const [model, setModel] = useState<{ id: string; name: string } | undefined>({
    id: assignment.formId,
    name: assignment.formName,
  });

  const [version, setVersion] = useState<EnrollmentFormVersionSummary>();

  const mutation = useEnrollmentFormMutation(context, onClose);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (version) {
      mutation.mutate({ kind: "reassign", assignmentId: assignment.id, formVersionId: version.id, expectedRevision: assignment.revision });
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) {
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3.5 p-5">
        <form onSubmit={submit}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <ArrowLeftRightIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Cambiar formulario asignado</DialogTitle>
            <DialogDescription className="text-center text-balance">
              {assignment.trainingPathName} · Ciclo {assignment.academicYear}. Las inscripciones ya iniciadas conservarán {assignment.formName},{" "}
              {getEnrollmentFormVersionLabel(assignment.versionNumber).toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <Field className="mt-5">
            <FieldLabel htmlFor="reassignment-model" required>
              Formulario
            </FieldLabel>
            <AsyncDropdown<EnrollmentFormModel>
              id="reassignment-model"
              value={model?.id}
              selectedLabel={model?.name}
              disabled={mutation.isPending}
              queryKey={enrollmentFormQueryKey(context, "model-options")}
              fetchPage={(input) => fetchEnrollmentFormModelPage(context.scope, context.institutionId, input)}
              getItemValue={(item) => item.id}
              getItemLabel={(item) => item.name}
              onValueChange={(_, item) => {
                if (item?.id !== model?.id) {
                  setModel(item);
                  setVersion(undefined);
                }
              }}
              placeholder="Seleccionar formulario"
              searchPlaceholder="Buscar formulario..."
              emptyMessage="No se encontraron formularios."
              errorMessage="No se pudieron cargar los formularios."
            />
          </Field>
          <Field className="mt-5">
            <FieldLabel htmlFor="reassignment-version" required>
              {model ? `Versión publicada de ${model.name}` : "Versión publicada"}
            </FieldLabel>
            <AsyncDropdown<EnrollmentFormVersionSummary>
              id="reassignment-version"
              value={version?.id}
              selectedLabel={version ? getEnrollmentFormVersionLabel(version.versionNumber) : undefined}
              disabled={!model || mutation.isPending}
              queryKey={[...enrollmentFormQueryKey(context, "version-options"), model?.id]}
              fetchPage={(input) =>
                model
                  ? fetchEnrollmentFormVersionPage(context.scope, context.institutionId, model.id, input)
                  : Promise.resolve({ items: [], nextPage: null })
              }
              getItemValue={(item) => item.id}
              getItemLabel={(item) =>
                `${getEnrollmentFormVersionLabel(item.versionNumber)} · ${ENROLLMENT_VERSION_LABELS[item.status]}${item.id === assignment.formVersionId ? " (actual)" : ""}`
              }
              getItemDisplayLabel={(item) => getEnrollmentFormVersionLabel(item.versionNumber)}
              getItemDisabled={(item) => item.status !== "PUBLISHED" || item.id === assignment.formVersionId}
              onValueChange={(_, item) => setVersion(item)}
              placeholder={model ? "Seleccionar versión publicada" : "Seleccioná un formulario primero"}
              searchPlaceholder="Buscar versión..."
              emptyMessage="No se encontraron versiones."
              errorMessage="No se pudieron cargar las versiones."
            />
          </Field>
          {mutation.error ? (
            <div className="mt-5">
              <EnrollmentFormFeedback error={mutation.error} />
            </div>
          ) : null}
          <DialogFooter className="-mx-5 mt-5 -mb-5 p-3.5">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!version || mutation.isPending}>
              {mutation.isPending ? "Cambiando…" : "Confirmar cambio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
