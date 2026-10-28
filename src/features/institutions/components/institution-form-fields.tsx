import type { PropsWithChildren, ReactElement } from "react";

import { Building2Icon, CircleCheckIcon, PhoneIcon, type LucideIcon } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { SectionHeader } from "@common/components/section-header";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { PhoneInput } from "@common/components/ui/restricted-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";

import { InstitutionLocationFields } from "@features/institutions/components/institution-location-fields";
import type { InstitutionFormInput } from "@features/institutions/schemas/institution-form.schema";

export { InstitutionLocationFields };

type InstitutionFormFieldsProps = {
  defaultValues: InstitutionFormInput;
  errors: FieldErrors<InstitutionFormInput>;
  register: UseFormRegister<InstitutionFormInput>;
};

export function InstitutionGeneralFields({ defaultValues, errors, register }: InstitutionFormFieldsProps): ReactElement {
  return (
    <InstitutionFormCard icon={Building2Icon} title="Información general" description="Nombre con el que se identifica la institución.">
      <FieldGroup className="flex flex-row flex-wrap items-start gap-4">
        <Field data-invalid={!!errors.name} className="flex-[1_0_min(200px,100%)]">
          <FieldContent>
            <FieldLabel htmlFor="institution-name" required>
              Nombre
            </FieldLabel>
          </FieldContent>
          <Input
            id="institution-name"
            defaultValue={defaultValues.name}
            maxLength={255}
            placeholder="Conservatorio Superior de Música"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.shortName} className="flex-[1_0_min(200px,100%)]">
          <FieldLabel htmlFor="institution-short-name">Nombre corto</FieldLabel>
          <Input
            id="institution-short-name"
            defaultValue={defaultValues.shortName}
            maxLength={50}
            aria-invalid={!!errors.shortName}
            {...register("shortName")}
          />
          <FieldError errors={[errors.shortName]} />
        </Field>
      </FieldGroup>
    </InstitutionFormCard>
  );
}

export function InstitutionContactFields({ defaultValues, errors, register }: InstitutionFormFieldsProps): ReactElement {
  return (
    <InstitutionFormCard icon={PhoneIcon} title="Contacto" description="Canales de comunicación de la institución.">
      <FieldGroup className="flex flex-row flex-wrap items-start gap-4">
        <Field data-invalid={!!errors.phoneNumber} className="flex-[1_0_min(200px,100%)]">
          <FieldContent>
            <FieldLabel htmlFor="institution-phone">Teléfono</FieldLabel>
          </FieldContent>
          <PhoneInput
            id="institution-phone"
            defaultValue={defaultValues.phoneNumber}
            maxLength={30}
            placeholder="0353-4619146"
            aria-invalid={!!errors.phoneNumber}
            {...register("phoneNumber")}
          />
          <FieldError errors={[errors.phoneNumber]} />
        </Field>

        <Field data-invalid={!!errors.email} className="flex-[1_0_min(200px,100%)]">
          <FieldContent>
            <FieldLabel htmlFor="institution-email">Correo electrónico</FieldLabel>
          </FieldContent>
          <Input
            id="institution-email"
            defaultValue={defaultValues.email}
            type="email"
            maxLength={150}
            placeholder="info@conservatorio.edu.ar"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
      </FieldGroup>
    </InstitutionFormCard>
  );
}

export function InstitutionStatusField({ active, onActiveChange }: { active: boolean; onActiveChange: (active: boolean) => void }): ReactElement {
  return (
    <InstitutionFormCard
      icon={CircleCheckIcon}
      title="Estado de la institución"
      description="Las instituciones inactivas no están disponibles para el acceso de usuarios."
    >
      <Field className="w-full">
        <FieldLabel htmlFor="institution-active" required>
          Estado
        </FieldLabel>
        <Select required value={String(active)} onValueChange={(value) => onActiveChange(value === "true")}>
          <SelectTrigger id="institution-active" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="true" className="px-2.5 py-1.5">
                Activa
              </SelectItem>
              <SelectItem value="false" className="px-2.5 py-1.5">
                Inactiva
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </InstitutionFormCard>
  );
}

function InstitutionFormCard({
  children,
  icon,
  title,
  description,
}: PropsWithChildren<{ icon: LucideIcon; title: string; description: string }>): ReactElement {
  return (
    <section className="bg-muted/25 rounded-xl border p-5 md:p-6">
      <header className="-mx-5 border-b px-5 pb-5 md:-mx-6 md:px-6">
        <SectionHeader icon={icon} title={title} description={description} descriptionBreakpoint="sm" />
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}
