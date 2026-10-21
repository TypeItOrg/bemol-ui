"use client";

import type { ReactElement } from "react";

import { CircleQuestionMarkIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Field, FieldError, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@common/components/ui/popover";

import { FormSelect } from "@features/academic/components/academic-form-controls";
import type { GuardianDependentActionState } from "@features/guardian-dependents/types/guardian-dependent-action-state.types";

export function GuardianDependentOwnAccessFields({
  disabled,
  fieldErrors,
  onChange,
  values,
}: {
  disabled: boolean;
  fieldErrors: GuardianDependentActionState["fieldErrors"];
  onChange: (field: "ownAccessRequested" | "email", value: string) => void;
  values: { ownAccessRequested: string; email: string };
}): ReactElement {
  function getErrors(field: "ownAccessRequested" | "email"): { message: string }[] | undefined {
    const message = fieldErrors?.[field];

    return message ? [{ message }] : undefined;
  }

  return (
    <>
      <Field data-invalid={!!fieldErrors?.ownAccessRequested}>
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor="dependent-own-access">Acceso propio</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="Información sobre el acceso propio"
                className="text-muted-foreground -my-1"
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <CircleQuestionMarkIcon aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              aria-labelledby="dependent-own-access-help-title"
              className="max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-4"
              collisionPadding={16}
            >
              <PopoverHeader>
                <PopoverTitle id="dependent-own-access-help-title">Acceso propio a la plataforma</PopoverTitle>
              </PopoverHeader>
              <p>Al habilitar esta opción, recibirá una invitación para activar su cuenta cuando se apruebe la vinculación.</p>
            </PopoverContent>
          </Popover>
        </div>
        <FormSelect
          id="dependent-own-access"
          name="ownAccessRequested"
          value={values.ownAccessRequested}
          onValueChange={(value) => {
            onChange("ownAccessRequested", value);

            if (value === "false") {
              onChange("email", "");
            }
          }}
          disabled={disabled}
          options={[
            { value: "false", label: "No" },
            { value: "true", label: "Sí" },
          ]}
        />
        <FieldError errors={getErrors("ownAccessRequested")} />
      </Field>

      {values.ownAccessRequested === "true" ? (
        <Field data-invalid={!!fieldErrors?.email}>
          <FieldLabel htmlFor="dependent-email" required>
            Correo de la persona
          </FieldLabel>
          <Input
            aria-invalid={!!fieldErrors?.email}
            autoComplete="email"
            disabled={disabled}
            id="dependent-email"
            name="email"
            onChange={(event) => onChange("email", event.currentTarget.value)}
            type="email"
            value={values.email}
          />
          <FieldError errors={getErrors("email")} />
        </Field>
      ) : null}
    </>
  );
}
