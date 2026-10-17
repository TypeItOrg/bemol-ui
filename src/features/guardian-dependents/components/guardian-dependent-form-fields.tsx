"use client";

import { useState, type ReactElement } from "react";

import { CircleQuestionMarkIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { DatePicker } from "@common/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@common/components/ui/popover";
import { NumericInput } from "@common/components/ui/restricted-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";

import { FormSelect } from "@features/academic/components/academic-form-controls";
import { calculateAge } from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import type { GuardianDependentActionState } from "@features/guardian-dependents/types/guardian-dependent-action-state.types";
import type { GuardianDependentFieldName } from "@features/guardian-dependents/types/guardian-dependent-field-name.types";
import { GUARDIAN_RELATIONSHIP } from "@features/guardian-dependents/types/guardian-relationship.types";
import { formatBirthDateInput, getLatestAllowedBirthDate } from "@features/people/utils/person-birth-date.util";

const RELATIONSHIP_OPTIONS = Object.values(GUARDIAN_RELATIONSHIP);

export function GuardianDependentFormFields({
  disabled,
  fieldErrors,
  onChange,
  values,
}: {
  disabled: boolean;
  fieldErrors: GuardianDependentActionState["fieldErrors"];
  onChange: (field: keyof typeof values, value: string) => void;
  values: {
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    relationship: string;
    isPrimaryContact: string;
    email: string;
    ownAccessRequested: string;
  };
}): ReactElement {
  const [birthDate, setBirthDate] = useState<Date>();

  const age = calculateAge(birthDate);

  function getErrors(field: GuardianDependentFieldName): { message: string }[] | undefined {
    const message = fieldErrors?.[field];

    return message ? [{ message }] : undefined;
  }

  return (
    <div className="@container/dependent-fields">
      <div className="grid items-start gap-4 @xl/dependent-fields:grid-cols-2 @4xl/dependent-fields:grid-cols-3">
        <Field data-invalid={!!fieldErrors?.firstName}>
          <FieldLabel htmlFor="dependent-first-name" required>
            Nombre
          </FieldLabel>
          <Input
            aria-invalid={!!fieldErrors?.firstName}
            disabled={disabled}
            id="dependent-first-name"
            name="firstName"
            onChange={(event) => onChange("firstName", event.currentTarget.value)}
            value={values.firstName}
          />
          <FieldError errors={getErrors("firstName")} />
        </Field>

        <Field data-invalid={!!fieldErrors?.lastName}>
          <FieldLabel htmlFor="dependent-last-name" required>
            Apellido
          </FieldLabel>
          <Input
            aria-invalid={!!fieldErrors?.lastName}
            disabled={disabled}
            id="dependent-last-name"
            name="lastName"
            onChange={(event) => onChange("lastName", event.currentTarget.value)}
            value={values.lastName}
          />
          <FieldError errors={getErrors("lastName")} />
        </Field>

        <Field data-invalid={!!fieldErrors?.documentNumber}>
          <FieldLabel htmlFor="dependent-document-number" required>
            Documento
          </FieldLabel>
          <NumericInput
            aria-invalid={!!fieldErrors?.documentNumber}
            disabled={disabled}
            id="dependent-document-number"
            maxLength={8}
            name="documentNumber"
            onChange={(event) => onChange("documentNumber", event.currentTarget.value)}
            value={values.documentNumber}
          />
          <FieldError errors={getErrors("documentNumber")} />
        </Field>

        <Field data-invalid={!!fieldErrors?.birthDate}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="dependent-birth-date" required>
              Fecha de nacimiento
            </FieldLabel>
            {age === null ? null : <Badge variant="outline">{age === 1 ? "1 año" : `${age} años`}</Badge>}
          </div>
          <input name="birthDate" type="hidden" value={values.birthDate} />
          <DatePicker
            aria-invalid={!!fieldErrors?.birthDate}
            disabled={disabled}
            id="dependent-birth-date"
            maxDate={getLatestAllowedBirthDate()}
            onChange={(date) => {
              setBirthDate(date);
              onChange("birthDate", formatBirthDateInput(date));
            }}
            value={birthDate}
          />
          <FieldError errors={getErrors("birthDate")} />
        </Field>

        <Field data-invalid={!!fieldErrors?.relationship}>
          <FieldLabel htmlFor="dependent-relationship" required>
            Vínculo
          </FieldLabel>
          <input name="relationship" type="hidden" value={values.relationship} />
          <Select disabled={disabled} onValueChange={(value) => onChange("relationship", value)} value={values.relationship}>
            <SelectTrigger aria-invalid={!!fieldErrors?.relationship} className="w-full" id="dependent-relationship">
              <SelectValue placeholder="Seleccioná el vínculo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <SelectItem className="px-2.5 py-1.5" key={option} value={option}>
                    {GUARDIAN_RELATIONSHIP_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError errors={getErrors("relationship")} />
        </Field>

        <Field data-invalid={!!fieldErrors?.isPrimaryContact}>
          <FieldLabel htmlFor="dependent-primary-contact">Contacto principal</FieldLabel>
          <FormSelect
            value={values.isPrimaryContact}
            onValueChange={(value) => onChange("isPrimaryContact", value)}
            disabled={disabled}
            id="dependent-primary-contact"
            name="isPrimaryContact"
            options={[
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ]}
          />
          <FieldError errors={getErrors("isPrimaryContact")} />
        </Field>

        <div className="grid items-start gap-4 @xl/dependent-fields:col-span-full @xl/dependent-fields:grid-cols-2">
          <Field data-invalid={!!fieldErrors?.ownAccessRequested}>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor="dependent-own-access">Acceso propio a la plataforma</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Información sobre el acceso propio"
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                    type="button"
                  >
                    <CircleQuestionMarkIcon aria-hidden="true" className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="max-w-[calc(100vw-2rem)] p-3">
                  <p>Podés gestionar sus trámites sin crearle una cuenta. La invitación se envía después de aprobar la vinculación.</p>
                </PopoverContent>
              </Popover>
            </div>
            <FormSelect
              id="dependent-own-access"
              name="ownAccessRequested"
              value={values.ownAccessRequested}
              onValueChange={(value) => onChange("ownAccessRequested", value)}
              disabled={disabled}
              options={[
                { value: "false", label: "Sin acceso propio" },
                { value: "true", label: "Invitar a activar su cuenta" },
              ]}
            />
            <FieldError errors={getErrors("ownAccessRequested")} />
          </Field>
          <Field data-invalid={!!fieldErrors?.email}>
            <FieldLabel htmlFor="dependent-email" required={values.ownAccessRequested === "true"}>
              Correo de la persona
            </FieldLabel>
            <Input
              id="dependent-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => onChange("email", event.target.value)}
              disabled={disabled}
            />
            <FieldError errors={getErrors("email")} />
          </Field>
        </div>
      </div>
    </div>
  );
}
