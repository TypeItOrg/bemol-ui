"use client";

import { startTransition, useActionState, useMemo, useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { CircleAlertIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { useActionFormErrorFocus } from "@common/hooks/use-action-form-error-focus";
import { FORM_MODE } from "@common/types/form-mode.types";

import type { InstitutionSummary } from "@features/institutions/types/institution-summary.types";
import { createInstitutionalPersonAction, createPlatformPersonAction } from "@features/people/actions/create-person.action";
import { updateInstitutionalPersonAction, updatePlatformPersonAction } from "@features/people/actions/update-person.action";
import { PersonCreateFields, PersonDetailsFields, PersonPasswordFields } from "@features/people/components/person-form-fields";
import { PersonInstitutionField } from "@features/people/components/person-institution-field";
import { ROLE_SCOPE_MESSAGES } from "@features/people/constants/role-scope.constants";
import type { PersonActionState } from "@features/people/types/person-action-state.types";
import type { PersonFormInput } from "@features/people/types/person-form-input.types";
import type { Person } from "@features/people/types/person.types";
import type { RoleAssignment } from "@features/people/types/role-assignment.types";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";
import {
  getDefaultValues,
  getErrorTitle,
  getFormData,
  getPersonFormResolver,
  getSubmitLabel,
  setActionFieldErrors,
} from "@features/people/utils/person-form.util";

type PersonFormCommonProps = {
  formId?: string;
  hideActions?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  scope?: PeopleScopeType;
  returnTo?: string;
};

type CreateMode = PersonFormCommonProps & {
  mode: typeof FORM_MODE.CREATE;
  institutionId?: string;
  person?: never;
  assignments?: never;
  canEdit?: never;
};

type EditMode = PersonFormCommonProps & {
  mode: typeof FORM_MODE.EDIT;
  institutionId: string;
  person: Person;
  assignments?: readonly RoleAssignment[];
  canEdit?: boolean;
};

type PersonFormProps = CreateMode | EditMode;

export function PersonForm(props: PersonFormProps): ReactElement {
  return <PersonFormView key={`${props.scope ?? PeopleScope.ADMIN}:${props.institutionId}:${props.person?.personId ?? "new"}`} {...props} />;
}

function PersonFormView({
  mode,
  institutionId,
  person,
  assignments,
  formId,
  hideActions = false,
  onPendingChange,
  canEdit = true,
  scope = PeopleScope.ADMIN,
  returnTo,
}: PersonFormProps): ReactElement {
  const router = useRouter();

  const [institution, setInstitution] = useState<InstitutionSummary>();

  const isEdit = mode === FORM_MODE.EDIT;

  const platformListPath = institutionId ? `/admin/institutions/${institutionId}/people` : "/admin/people";

  const listPath = PeopleScope.isInstitutional(scope) ? "/people" : platformListPath;

  const destination = returnTo ?? listPath;

  const resolver = getPersonFormResolver(isEdit);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PersonFormInput>({
    resolver,
    defaultValues: getDefaultValues(person),
  });

  const [actionState, formAction, isPending] = useActionState(
    async (_previous: PersonActionState, values: PersonFormInput): Promise<PersonActionState> => {
      if (assignments?.some((assignment) => assignment.accessScope === "TRAINING_PATHS" && assignment.trainingPathIds.length === 0)) {
        return { error: ROLE_SCOPE_MESSAGES.REQUIRED_ASSIGNMENT };
      }

      onPendingChange?.(true);

      try {
        const formData = getFormData(values, isEdit, canEdit, assignments);

        const result = await submitPerson(formData);

        const hasFieldErrors = setActionFieldErrors(result, setError);

        if (result.success) {
          router.push(destination);
        }

        return { ...result, error: hasFieldErrors ? undefined : result.error };
      } finally {
        onPendingChange?.(false);
      }
    },
    {},
  );

  const formError = actionState.error;

  const errorState = useMemo(() => ({ error: formError, fieldErrors: errors }), [formError, errors]);

  const formRef = useActionFormErrorFocus(errorState, isPending);

  function onSubmit(values: PersonFormInput): void {
    startTransition(() => formAction(values));
  }

  async function submitPerson(formData: FormData): Promise<PersonActionState> {
    const targetInstitutionId = institutionId ?? institution?.id;

    if (!targetInstitutionId) {
      return { error: "Seleccioná una institución para crear el usuario." };
    }

    if (isEdit && person) {
      if (PeopleScope.isInstitutional(scope)) {
        return updateInstitutionalPersonAction(targetInstitutionId, person.personId, formData);
      }

      return updatePlatformPersonAction(targetInstitutionId, person.personId, formData);
    }

    if (PeopleScope.isInstitutional(scope)) {
      return createInstitutionalPersonAction(targetInstitutionId, formData);
    }

    return createPlatformPersonAction(targetInstitutionId, formData);
  }

  function handleCancel(): void {
    router.push(destination);
  }

  return (
    <form ref={formRef} id={formId} onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
      {formError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{getErrorTitle(isEdit)}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {!isEdit && scope === PeopleScope.ADMIN && !institutionId && (
        <PersonInstitutionField
          institution={institution}
          onChange={setInstitution}
          disabled={isPending}
          invalid={Boolean(formError) && !institution}
        />
      )}

      <fieldset disabled={isEdit && !canEdit} className="contents">
        <PersonDetailsFields errors={errors} isEdit={isEdit} person={person} register={register} />
      </fieldset>

      {isEdit ? (
        <fieldset disabled={!canEdit} className="contents">
          <PersonPasswordFields errors={errors} register={register} />
        </fieldset>
      ) : (
        <PersonCreateFields control={control} errors={errors} register={register} />
      )}

      {!hideActions && (
        <div className="flex flex-row flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={handleCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={isPending}>
            {getSubmitLabel({ isEdit, isPending, canEdit })}
          </Button>
        </div>
      )}
    </form>
  );
}
