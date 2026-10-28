"use client";

import { useState, type ReactElement } from "react";

import Link from "next/link";

import { InstitutionalAuthDescription } from "@features/institutional-auth/components/institutional-auth-description";
import { InstitutionalAuthStepHeader } from "@features/institutional-auth/components/institutional-auth-step-header";
import { useInstitutionalBrand } from "@features/institutional-auth/components/institutional-brand-context";
import { VerificationRequestForm } from "@features/institutional-auth/components/verification-request-form";
import type { EmailVerificationContext } from "@features/institutional-auth/types/email-verification-context.types";
import type { PublicInstitution } from "@features/institutions/types/public-institution.types";

export function EmailVerificationForm({ context }: { context?: EmailVerificationContext }): ReactElement {
  const institution = useInstitutionalBrand();

  const [identity, setIdentity] = useState(() => getInitialIdentity(institution, context));

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
        <InstitutionalAuthStepHeader
          showInstitutionName={false}
          title="Verificá tu correo electrónico"
          description={
            <InstitutionalAuthDescription
              generic="Ingresá tus datos para recibir un nuevo enlace de verificación."
              before="Ingresá tus datos para verificar tu cuenta del portal institucional del "
              after="."
            />
          }
        />
        <VerificationRequestForm identity={identity} onIdentityChange={setIdentity} />
      </div>

      <footer className="text-muted-foreground flex min-h-[4.5rem] items-center justify-center gap-1 border-t px-5 text-center text-sm sm:px-8">
        <span>¿Ya verificaste tu cuenta?</span>
        <Link href="/auth/login" className="text-primary font-medium underline underline-offset-4">
          Iniciar sesión
        </Link>
      </footer>
    </div>
  );
}

function getInitialIdentity(
  institution: PublicInstitution | undefined,
  context: EmailVerificationContext | undefined,
): EmailVerificationContext | undefined {
  if (institution) {
    return {
      institutionId: institution.id,
      institutionName: institution.name,
      documentNumber: context?.institutionId === institution.id ? context.documentNumber : "",
    };
  }

  if (context?.institutionName) {
    return context;
  }

  if (context) {
    return { ...context, institutionId: "" };
  }

  return undefined;
}
