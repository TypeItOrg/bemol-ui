"use client";

import { useActionState, type ReactElement } from "react";

import { Loader2Icon } from "lucide-react";

import { ActionForm } from "@common/components/action-form";
import { Button } from "@common/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { NumericInput } from "@common/components/ui/restricted-input";

import { resendEmailVerification } from "@features/institutional-auth/actions/email-verification.actions";
import { EmailVerificationFeedback } from "@features/institutional-auth/components/email-verification-feedback";
import { InstitutionalAuthInstitutionField } from "@features/institutional-auth/components/institutional-auth-institution-field";
import type { EmailVerificationContext } from "@features/institutional-auth/types/email-verification-context.types";
import type { EmailVerificationState } from "@features/institutional-auth/types/email-verification-state.types";

export function VerificationRequestForm({
  identity,
  onIdentityChange,
}: {
  identity?: EmailVerificationContext;
  onIdentityChange: (value: EmailVerificationContext) => void;
}): ReactElement {
  const [state, action, pending] = useActionState<EmailVerificationState, FormData>(resendEmailVerification, {});

  return (
    <ActionForm resetOnSuccess={Boolean(state.success)} action={action} noValidate className="mt-6 space-y-5">
      <EmailVerificationFeedback state={state} successMessage="Si tu cuenta está pendiente, recibirás un enlace." />
      <FieldGroup>
        <InstitutionalAuthInstitutionField
          id="verification-institution"
          institution={identity ? { id: identity.institutionId, name: identity.institutionName ?? "" } : undefined}
          disabled={pending}
          error={state.fieldErrors?.institutionId}
          onChange={(item) =>
            onIdentityChange({
              institutionId: item?.id ?? "",
              institutionName: item?.name,
              documentNumber: identity?.documentNumber ?? "",
            })
          }
        />
        <Field data-invalid={!!state.fieldErrors?.documentNumber}>
          <FieldLabel htmlFor="verification-document" required>
            Documento
          </FieldLabel>
          <NumericInput
            id="verification-document"
            name="documentNumber"
            maxLength={8}
            autoComplete="username"
            disabled={pending}
            value={identity?.documentNumber ?? ""}
            aria-invalid={!!state.fieldErrors?.documentNumber}
            onChange={(event) =>
              onIdentityChange({
                ...identity,
                institutionId: identity?.institutionId ?? "",
                documentNumber: event.target.value,
              })
            }
          />
          <FieldError>{state.fieldErrors?.documentNumber}</FieldError>
        </Field>
      </FieldGroup>
      <div className="flex flex-col gap-4">
        <Button type="submit" size="lg" className="h-auto min-h-9 py-2 whitespace-normal" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {pending ? "Enviando…" : "Reenviar enlace"}
        </Button>
        <p className="text-muted-foreground text-center text-sm">Si necesitás corregir el correo registrado, contactá a tu institución.</p>
      </div>
    </ActionForm>
  );
}
