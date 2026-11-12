"use client";

import { useState, type FormEvent, type ReactElement } from "react";

import { PencilIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";

import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormModel } from "@features/enrollment-forms/types/enrollment-form-model.types";

export function EnrollmentFormRename({
  context,
  model,
  onDone,
}: {
  context: EnrollmentFormContext;
  model: EnrollmentFormModel;
  onDone: () => void;
}): ReactElement {
  const [name, setName] = useState(model.name);

  const [revision] = useState(model.revision);

  const mutation = useEnrollmentFormMutation<EnrollmentFormModel>(context, onDone);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ kind: "rename", formId: model.id, name, expectedRevision: revision });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) {
          onDone();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3.5 p-5">
        <form onSubmit={submit}>
          <DialogHeader className="items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
              <PencilIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Cambiar nombre del formulario</DialogTitle>
            <DialogDescription className="text-center text-balance">El nuevo nombre no modifica sus versiones ni sus asignaciones.</DialogDescription>
          </DialogHeader>
          <Field className="mt-5">
            <FieldLabel htmlFor="rename-form-name" required>
              Nombre del formulario
            </FieldLabel>
            <Input
              id="rename-form-name"
              value={name}
              maxLength={150}
              disabled={mutation.isPending}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
            />
          </Field>
          {mutation.error ? (
            <div className="mt-5">
              <EnrollmentFormFeedback error={mutation.error} />
            </div>
          ) : null}
          <DialogFooter className="-mx-5 mt-5 -mb-5 p-3.5">
            <Button type="button" variant="outline" size="lg" disabled={mutation.isPending} onClick={onDone}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? "Guardando…" : "Guardar nombre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
