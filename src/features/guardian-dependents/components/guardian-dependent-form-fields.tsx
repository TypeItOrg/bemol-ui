"use client";

import type { ReactElement } from "react";

import { Badge } from "@common/components/ui/badge";
import { DatePicker } from "@common/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { NumericInput } from "@common/components/ui/restricted-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";

import { FormSelect } from "@features/academic/components/academic-form-controls";
import { calculateAge } from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { GuardianDependentOwnAccessFields } from "@features/guardian-dependents/components/guardian-dependent-own-access-fields";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import type { GuardianDependentActionState } from "@features/guardian-dependents/types/guardian-dependent-action-state.types";
import type { GuardianDependentFieldName } from "@features/guardian-dependents/types/guardian-dependent-field-name.types";
import { GUARDIAN_RELATIONSHIP } from "@features/guardian-dependents/types/guardian-relationship.types";
import { formatBirthDateInput, getLatestAllowedBirthDate, parseBirthDateInput } from "@features/people/utils/person-birth-date.util";

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
    requestMode: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    relationship: string;
    isPrimaryContact: string;
    ownAccessRequested: string;
    email: string;
  };
}): ReactElement {
  const birthDate = parseBirthDateInput(values.birthDate);

  const age = calculateAge(birthDate);

  function getErrors(field: GuardianDependentFieldName): { message: string }[] | undefined {
    const message = fieldErrors?.[field];

    return message ? [{ message }] : undefined;
  }

  return (
    <div className="@container/dependent-fields">
      <div className="flex flex-wrap items-start gap-4 *:min-w-0 *:grow *:basis-full @xl/dependent-fields:*:basis-[calc(50%-0.5rem)] @3xl/dependent-fields:*:basis-[calc(25%-0.75rem)] @3xl/dependent-fields:[&>:nth-child(-n+3)]:basis-[calc(23%-0.75rem)] @3xl/dependent-fields:[&>:nth-child(4)]:basis-[calc(31%-0.75rem)]">
        {values.requestMode === "NEW" ? (
          <>
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
          </>
        ) : null}

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

        {values.requestMode === "NEW" ? (
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
                onChange("birthDate", formatBirthDateInput(date));
              }}
              value={birthDate}
            />
            <FieldError errors={getErrors("birthDate")} />
          </Field>
        ) : null}

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

        <GuardianDependentOwnAccessFields disabled={disabled} fieldErrors={fieldErrors} onChange={onChange} values={values} />
      </div>
    </div>
  );
}
