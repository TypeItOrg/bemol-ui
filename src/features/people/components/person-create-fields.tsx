import type { ReactElement } from "react";

import { ShieldCheckIcon } from "lucide-react";
import { Controller, type Control } from "react-hook-form";

import { DatePicker } from "@common/components/ui/date-picker";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { NumericInput } from "@common/components/ui/restricted-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";

import { PersonFormCard, PersonFormSectionHeading } from "@features/people/components/person-form-card";
import { type PersonFormFieldsProps } from "@features/people/types/person-form-fields-props.types";
import type { PersonFormInput } from "@features/people/types/person-form-input.types";
import { SystemRoleCode } from "@features/people/types/system-role-code.types";
import { formatBirthDateInput, getLatestAllowedBirthDate, parseBirthDateInput } from "@features/people/utils/person-birth-date.util";

export function PersonCreateFields({ control, errors, register, isEdit }: PersonCreateFieldsProps): ReactElement {
  return (
    <PersonFormCard>
      <PersonFormSectionHeading
        icon={ShieldCheckIcon}
        title="Identidad verificada"
        description={isEdit ? undefined : "La persona elegirá su contraseña al activar el acceso."}
      />
      <FieldGroup className="mt-4 flex flex-row flex-wrap items-start gap-4 sm:mt-5">
        <Field data-invalid={!!errors.documentNumber} className="flex-[1_0_min(200px,100%)]">
          <FieldContent>
            <FieldLabel htmlFor="person-document" required>
              Documento
            </FieldLabel>
          </FieldContent>
          <NumericInput id="person-document" aria-invalid={!!errors.documentNumber} {...register("documentNumber")} />
          <FieldError errors={[errors.documentNumber]} />
        </Field>

        <Field data-invalid={!!errors.birthDate} className="flex-[1_0_min(200px,100%)]">
          <FieldContent>
            <FieldLabel htmlFor="person-birth-date" required>
              Fecha de nacimiento
            </FieldLabel>
          </FieldContent>
          <Controller
            control={control}
            name="birthDate"
            render={({ field, fieldState }) => (
              <DatePicker
                id="person-birth-date"
                value={parseBirthDateInput(field.value)}
                maxDate={getLatestAllowedBirthDate()}
                onChange={(date) => field.onChange(formatBirthDateInput(date))}
                aria-invalid={fieldState.invalid}
              />
            )}
          />
          <FieldError errors={[errors.birthDate]} />
        </Field>
        {!isEdit && (
          <Field data-invalid={!!errors.initialRole} className="flex-[1_0_min(200px,100%)]">
            <FieldLabel htmlFor="person-initial-role" required>
              Rol inicial
            </FieldLabel>
            <Controller
              control={control}
              name="initialRole"
              render={({ field, fieldState }) => (
                <Select name={field.name} value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger id="person-initial-role" aria-invalid={fieldState.invalid} onBlur={field.onBlur} ref={field.ref} className="w-full">
                    <SelectValue placeholder="Seleccioná un rol inicial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={SystemRoleCode.APPLICANT} className="px-2.5 py-1.5">
                        Postulante
                      </SelectItem>
                      <SelectItem value={SystemRoleCode.REPRESENTATIVE} className="px-2.5 py-1.5">
                        Representante
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.initialRole]} />
          </Field>
        )}
      </FieldGroup>
    </PersonFormCard>
  );
}

export type PersonCreateFieldsProps = PersonFormFieldsProps & {
  control: Control<PersonFormInput>;
  isEdit: boolean;
};
