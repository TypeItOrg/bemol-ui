"use client";

import { useState, type FormEvent, type ReactElement } from "react";

import { FilePlusIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@common/components/ui/dialog";
import { Field, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";

import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { useEnrollmentFormMutation } from "@features/enrollment-forms/hooks/use-enrollment-form-admin";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormModel } from "@features/enrollment-forms/types/enrollment-form-model.types";

export function EnrollmentFormCreateDialog({
  context,
  onCreated,
  onClose,
}: {
  context: EnrollmentFormContext;
  onCreated: (model: EnrollmentFormModel) => void;
  onClose: () => void;
}): ReactElement {
  const [name, setName] = useState("");

  const mutation = useEnrollmentFormMutation<EnrollmentFormModel>(context, onCreated);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ kind: "create", name });
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
              <FilePlusIcon aria-hidden="true" className="size-6" />
            </div>
            <DialogTitle className="text-center font-semibold">Nuevo formulario</DialogTitle>
            <DialogDescription className="text-center text-balance">
              Se crea un borrador a partir del formulario base. Podés editarlo y publicarlo cuando esté listo.
            </DialogDescription>
          </DialogHeader>
          <Field className="mt-5">
            <FieldLabel htmlFor="new-form-name" required>
              Nombre del formulario
            </FieldLabel>
            <Input
              id="new-form-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={150}
              required
              autoFocus
              placeholder="Por ejemplo: Inscripción a talleres"
              disabled={mutation.isPending}
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
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? "Creando…" : "Crear formulario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
