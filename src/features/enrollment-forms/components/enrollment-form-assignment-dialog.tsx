"use client";

import { useState, type FormEvent, type ReactElement } from "react";

import { RouteIcon } from "lucide-react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldLabel } from "@common/components/ui/field";

import { fetchAcademicOptionPage } from "@features/academic/services/academic-options.service";
import type { AcademicYear } from "@features/academic/types/academic-year.types";
import type { TrainingPath } from "@features/academic/types/training-path.types";
import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormVersion } from "@features/enrollment-forms/types/enrollment-form-version.types";
import { getEnrollmentFormVersionLabel } from "@features/enrollment-forms/utils/enrollment-form-version-label.util";

export function EnrollmentFormAssignmentDialog({
  context,
  version,
  modelName,
  onClose,
}: {
  context: EnrollmentFormContext;
  version: EnrollmentFormVersion;
  modelName: string;
  onClose: () => void;
}): ReactElement {
  const [path, setPath] = useState<TrainingPath>();

  const [year, setYear] = useState<AcademicYear>();

  const mutation = useEnrollmentFormMutation(context, onClose);

  const scope = context.scope === "platform" ? "admin" : "institutional";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (path && year) {
      mutation.mutate({ kind: "assign", trainingPathId: path.id, academicYearId: year.id, formVersionId: version.id });
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
        <form className="min-w-0" onSubmit={submit}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <RouteIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Asignar formulario</DialogTitle>
            <DialogDescription className="text-center text-balance">
              {modelName} · {getEnrollmentFormVersionLabel(version.versionNumber)}. Solo las nuevas inscripciones usarán esta versión. Si el trayecto
              ya tiene un formulario en ese ciclo, cambialo desde Formularios por trayecto y ciclo.
            </DialogDescription>
          </DialogHeader>
          <Field className="mt-5">
            <FieldLabel htmlFor="form-assignment-path" required>
              Trayecto
            </FieldLabel>
            <AsyncDropdown<TrainingPath>
              id="form-assignment-path"
              value={path?.id}
              selectedLabel={path?.name}
              disabled={mutation.isPending}
              queryKey={["enrollment-form-paths", scope, context.institutionId]}
              fetchPage={(input) => fetchAcademicOptionPage("training-paths", scope, context.institutionId, input, { active: true })}
              getItemValue={(item) => item.id}
              getItemLabel={(item) => item.name}
              onValueChange={(_, item) => setPath(item)}
              placeholder="Seleccionar trayecto activo"
            />
          </Field>
          <Field className="mt-5">
            <FieldLabel htmlFor="form-assignment-year" required>
              Ciclo lectivo
            </FieldLabel>
            <AsyncDropdown<AcademicYear>
              id="form-assignment-year"
              value={year?.id}
              selectedLabel={year ? String(year.year) : undefined}
              disabled={mutation.isPending}
              queryKey={["enrollment-form-years", scope, context.institutionId]}
              fetchPage={(input) => fetchAcademicOptionPage("academic-years", scope, context.institutionId, input, { active: "all" })}
              getItemValue={(item) => item.id}
              getItemLabel={(item) => `${item.year}${item.status === "CLOSED" ? " · Cerrado" : ""}`}
              getItemDisabled={(item) => item.status === "CLOSED"}
              onValueChange={(_, item) => setYear(item)}
              placeholder="Seleccionar ciclo abierto"
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
            <Button type="submit" disabled={!path || !year || mutation.isPending}>
              {mutation.isPending ? "Asignando…" : "Asignar versión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
