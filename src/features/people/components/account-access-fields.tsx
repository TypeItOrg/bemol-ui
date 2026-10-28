import type { ReactElement } from "react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Checkbox } from "@common/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { PasswordInput } from "@common/components/ui/password-input";

import { FormSelect } from "@features/academic/components/academic-form-controls";
import { TextField } from "@features/institutional-auth/components/institutional-profile-fields";
import type { ManageAccountAccessState } from "@features/people/actions/manage-account-access.action";
import type { AccountAccessOperation } from "@features/people/utils/account-access-options.util";

export function AccountAccessFields({
  id,
  owner,
  operation,
  options,
  onOperationChange,
  email,
  pending,
  state,
}: {
  id: string;
  owner: boolean;
  operation: AccountAccessOperation;
  options: { value: AccountAccessOperation; label: string }[];
  onOperationChange: (operation: AccountAccessOperation) => void;
  email: string;
  pending: boolean;
  state: ManageAccountAccessState;
}): ReactElement {
  const sensitive = ["email", "recover", "autonomy"].includes(operation);

  const requiresEmail = ["email", "invite", "autonomy"].includes(operation);

  const hasFieldErrors = Boolean(state.fieldErrors && Object.keys(state.fieldErrors).length > 0);

  let successMessage = "La operación se completó correctamente.";

  if (owner) {
    successMessage = "Te enviamos un enlace de confirmación al nuevo correo. Tu dirección actual seguirá vigente hasta que lo confirmes.";
  } else if (operation === "email") {
    successMessage = "Solicitud enviada. El cambio se aplicará cuando se confirme desde el nuevo correo.";
  }

  return (
    <div className="space-y-4">
      {owner ? (
        <input type="hidden" name="operation" value="email" />
      ) : (
        <Field>
          <FieldLabel htmlFor={`${id}-operation`}>Operación</FieldLabel>
          <FormSelect
            id={`${id}-operation`}
            name="operation"
            value={operation}
            disabled={pending}
            options={options}
            onValueChange={(value) => onOperationChange(value as AccountAccessOperation)}
          />
        </Field>
      )}
      {requiresEmail || sensitive ? (
        <FieldGroup className={owner ? "flex flex-row flex-wrap items-start gap-4" : "gap-4"}>
          {requiresEmail ? (
            <TextField
              id={`${id}-email`}
              key={operation}
              name="email"
              label={owner ? "Nuevo correo electrónico" : "Correo electrónico de destino"}
              className={owner ? "flex-[1_0_min(220px,100%)]" : ""}
              description={!owner && operation === "email" ? "El correo actual no cambiará hasta que se confirme la nueva dirección." : undefined}
              type="text"
              inputMode="email"
              autoComplete="email"
              defaultValue={operation === "email" ? "" : email}
              error={state.fieldErrors?.email}
              disabled={pending}
              required
            />
          ) : null}
          {sensitive ? (
            <Field data-invalid={!!state.fieldErrors?.currentPassword} className={owner ? "flex-[1_0_min(220px,100%)]" : undefined}>
              <FieldContent>
                <FieldLabel htmlFor={`${id}-password`} required>
                  {owner ? "Contraseña actual" : "Tu contraseña actual"}
                </FieldLabel>
              </FieldContent>
              <PasswordInput
                id={`${id}-password`}
                name="currentPassword"
                autoComplete="current-password"
                aria-invalid={!!state.fieldErrors?.currentPassword}
                disabled={pending}
              />
              {!owner ? <FieldDescription>Ingresá la contraseña de tu propia cuenta para confirmar la operación.</FieldDescription> : null}
              <FieldError>{state.fieldErrors?.currentPassword}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
      ) : null}
      {operation === "autonomy" ? (
        <Field orientation="horizontal" data-invalid={!!state.fieldErrors?.confirmed} data-disabled={pending}>
          <Checkbox id={`${id}-confirmed`} name="confirmed" value="yes" disabled={pending} aria-invalid={!!state.fieldErrors?.confirmed} />
          <FieldContent>
            <FieldLabel htmlFor={`${id}-confirmed`} className="font-normal">
              Verifiqué el correo de destino. Se finalizarán todos los vínculos de representación, se revocarán las credenciales anteriores y el
              acceso quedará pendiente hasta activar la nueva invitación.
            </FieldLabel>
            <FieldError>{state.fieldErrors?.confirmed}</FieldError>
          </FieldContent>
        </Field>
      ) : null}
      {state.error && !hasFieldErrors ? (
        <Alert variant="destructive">
          <AlertDescription role="alert">{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <AlertDescription role="status">{successMessage}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
