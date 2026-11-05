"use client";

import { useActionState, useState, type ReactElement } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CircleAlertIcon, UserRoundIcon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { FieldGroup } from "@common/components/ui/field";
import { formatDisplayDate } from "@common/utils/date-input.util";

import { updateInstitutionalProfileAction } from "@features/institutional-auth/actions/update-institutional-profile.action";
import { TextField } from "@features/institutional-auth/components/institutional-profile-fields";
import { InstitutionalProfileLocationSection } from "@features/institutional-auth/components/institutional-profile-location-section";
import type { InstitutionalPerson } from "@features/institutional-auth/types/institutional-person.types";

type InstitutionalProfileFormProps = {
  person: InstitutionalPerson;
  returnTo?: string;
  canEditContactEmail?: boolean;
};

export function InstitutionalProfileForm(props: InstitutionalProfileFormProps): ReactElement {
  return <InstitutionalProfileFormView key={`${props.person.institutionId}:${props.person.personId}`} {...props} />;
}

function InstitutionalProfileFormView({
  person,
  returnTo = "/account/profile",
  canEditContactEmail = false,
}: InstitutionalProfileFormProps): ReactElement {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_previous: Awaited<ReturnType<typeof updateInstitutionalProfileAction>>, formData: FormData) => {
      if (!person.email && formData.get("email") === "") {
        formData.delete("email");
      }

      const result = await updateInstitutionalProfileAction(formData);

      if (result.success) {
        router.replace(returnTo);
      }

      return result;
    },
    {},
  );

  const fieldErrors = "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};

  const error = Object.keys(fieldErrors).length === 0 && "error" in state ? state.error : undefined;

  const [addressCityId, setAddressCityId] = useState(person.address?.city?.id ?? "");

  const [addressStreet, setAddressStreet] = useState(person.address?.street ?? "");

  const hasAddress = Boolean(addressCityId || addressStreet.trim());

  return (
    <ActionForm action={formAction} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon className="size-4" />
          <AlertTitle>¡Ups! No se pudieron guardar los cambios</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="bg-muted/25 rounded-xl border p-4 sm:p-5">
        <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5">
          <SectionHeader icon={UserRoundIcon} title="Datos personales" description="Algunos datos solo puede actualizarlos la institución." />
        </header>
        <div className="mt-4 sm:mt-5">
          <FieldGroup className="flex flex-row flex-wrap items-start gap-4">
            <TextField id="profile-first-name" disabled label="Nombre" defaultValue={person.firstName} error={fieldErrors.firstName} required />
            <TextField id="profile-last-name" disabled label="Apellido" defaultValue={person.lastName} error={fieldErrors.lastName} required />
            <TextField id="profile-document" label="Documento Nacional de Identidad" value={person.documentNumber} disabled />
            <TextField id="profile-birth-date" label="Fecha de nacimiento" value={formatDisplayDate(person.birthDate)} disabled />
          </FieldGroup>
          <FieldGroup className="mt-4 flex flex-row flex-wrap items-start gap-4">
            <TextField
              id="profile-email"
              name={canEditContactEmail ? "email" : undefined}
              disabled={!canEditContactEmail}
              required={canEditContactEmail && Boolean(person.email)}
              label={canEditContactEmail ? "Correo de contacto" : "Correo electrónico"}
              type="email"
              defaultValue={person.email ?? ""}
              error={fieldErrors.email}
            />
            <TextField
              id="profile-phone"
              required
              name="phoneNumber"
              label="Teléfono"
              defaultValue={person.phoneNumber ?? ""}
              error={fieldErrors.phoneNumber}
            />
          </FieldGroup>
        </div>
      </div>

      <InstitutionalProfileLocationSection
        fieldErrors={fieldErrors}
        hasAddress={hasAddress}
        person={person}
        onAddressCityChange={(value) => setAddressCityId(value ?? "")}
        onAddressStreetChange={setAddressStreet}
      />

      <div className="flex flex-row flex-wrap items-center justify-end gap-3">
        <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
          <Link href={returnTo}>Cancelar</Link>
        </Button>
        <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </ActionForm>
  );
}
