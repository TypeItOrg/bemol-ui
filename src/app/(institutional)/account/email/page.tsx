import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalAccountHeader } from "@features/institutional-auth/components/institutional-account-header";
import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { AccountAccessPanel } from "@features/people/components/account-access-panel";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Correo electrónico");
}

export default async function EmailPage(): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!user.userId || user.delegated) {
    return <InstitutionalAccessDenied description="Las credenciales personales solo se gestionan desde la cuenta de su titular." />;
  }

  const person = await fetchInstitutionalPerson();

  if (!person) {
    notFound();
  }

  return (
    <>
      <InstitutionalAccountHeader />
      <AccountAccessPanel institutionId={person.institutionId} personId={person.personId} mode="owner" email={person.email ?? ""} />
    </>
  );
}
