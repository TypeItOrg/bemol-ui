import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstitutionalProfile } from "@features/institutional-auth/components/institutional-profile";
import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Perfil");
}

export default async function ProfilePage(): Promise<ReactElement> {
  const [user, person] = await Promise.all([requireInstitutionalUser(), fetchInstitutionalPerson()]);

  if (!person) {
    notFound();
  }

  return <InstitutionalProfile person={person} canManageEmail={Boolean(user.userId) && !user.delegated} />;
}
