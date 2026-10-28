import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstitutionalAccountHeader } from "@features/institutional-auth/components/institutional-account-header";
import { InstitutionalProfile } from "@features/institutional-auth/components/institutional-profile";
import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Mi perfil");
}

export default async function ProfilePage(): Promise<ReactElement> {
  const person = await fetchInstitutionalPerson();

  if (!person) {
    notFound();
  }

  return (
    <>
      <InstitutionalAccountHeader />
      <InstitutionalProfile person={person} />
    </>
  );
}
