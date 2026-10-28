import type { ReactElement } from "react";

import type { Metadata } from "next";

import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalAccountHeader } from "@features/institutional-auth/components/institutional-account-header";
import { InstitutionalPasswordForm } from "@features/institutional-auth/components/institutional-password-form";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Contraseña");
}

export default async function PasswordPage(): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.userId || user.delegated) {
    return <InstitutionalAccessDenied description="Las credenciales personales solo se gestionan desde la cuenta de su titular." />;
  }

  return (
    <>
      <InstitutionalAccountHeader />
      <InstitutionalPasswordForm />
    </>
  );
}
