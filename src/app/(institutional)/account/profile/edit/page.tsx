import type { ReactElement } from "react";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@common/components/ui/button";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { InstitutionalProfileForm } from "@features/institutional-auth/components/institutional-profile";
import { fetchInstitutionalPerson } from "@features/institutional-auth/services/fetch-institutional-person.service";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { canEditContactEmail } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Editar perfil");
}

export default async function EditProfilePage({ searchParams }: { searchParams: Promise<{ returnTo?: QueryParamValue }> }): Promise<ReactElement> {
  const { returnTo } = await searchParams;

  const destination = getSafeReturnTo(returnTo, "/account/profile");

  const [user, person] = await Promise.all([requireInstitutionalUser(), fetchInstitutionalPerson()]);

  if (!person) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="lg">
          <Link href={destination}>Volver</Link>
        </Button>
      </div>
      <InstitutionalProfileForm person={person} returnTo={destination} canEditContactEmail={canEditContactEmail(user)} />
    </>
  );
}
