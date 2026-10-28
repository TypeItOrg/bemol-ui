import type { ReactElement } from "react";

import { BuildingIcon } from "lucide-react";

import { AsyncDropdown } from "@common/components/ui/async-dropdown";
import { Field, FieldLabel } from "@common/components/ui/field";

import { INSTITUTION_ERROR_MESSAGES } from "@features/institutions/constants/error-messages.constants";
import { fetchActivePlatformInstitutionOptions } from "@features/institutions/services/fetch-platform-institution-options.service";
import type { InstitutionSummary } from "@features/institutions/types/institution-summary.types";
import { PersonFormCard, PersonFormSectionHeading } from "@features/people/components/person-form-card";

type PersonInstitutionFieldProps = {
  institution?: InstitutionSummary;
  onChange: (institution: InstitutionSummary | undefined) => void;
  disabled: boolean;
  invalid: boolean;
};

export function PersonInstitutionField({ institution, onChange, disabled, invalid }: PersonInstitutionFieldProps): ReactElement {
  return (
    <PersonFormCard>
      <PersonFormSectionHeading icon={BuildingIcon} title="Institución" />
      <Field className="mt-4 sm:mt-5" data-invalid={invalid}>
        <FieldLabel htmlFor="person-institution" required>
          Institución
        </FieldLabel>
        <AsyncDropdown<InstitutionSummary>
          id="person-institution"
          aria-required
          ariaInvalid={invalid}
          disabled={disabled}
          emptyDescription="No hay instituciones activas disponibles para crear usuarios."
          emptyIcon={BuildingIcon}
          emptyMessage="No se encontraron instituciones."
          emptyTitle="No hay instituciones activas"
          errorMessage={INSTITUTION_ERROR_MESSAGES.FETCH_INSTITUTIONS}
          fetchPage={fetchActivePlatformInstitutionOptions}
          getItemLabel={(item) => item.name}
          getItemValue={(item) => item.id}
          onValueChange={(_value, item) => onChange(item)}
          placeholder="Seleccionar institución"
          queryKey={["platform", "institutions", "people-create", "active"]}
          searchPlaceholder="Buscar institución..."
          selectedLabel={institution?.name}
          value={institution?.id}
        />
      </Field>
    </PersonFormCard>
  );
}
