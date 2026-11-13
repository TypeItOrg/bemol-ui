import type { ReactElement } from "react";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { UserRoundPenIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import type { QueryParamValue } from "@common/types/query-param.types";
import { appendReturnTo, getSafeReturnTo } from "@common/utils/return-to.util";

import { PersonAccessButton } from "@features/people/components/person-access-button";
import { PersonDeleteButton } from "@features/people/components/person-delete-button";
import { PersonDetailView } from "@features/people/components/person-detail-view";
import { PersonEditForm } from "@features/people/components/person-edit-form";
import { fetchPersonRoles } from "@features/people/services/fetch-person-roles.service";
import { fetchPerson } from "@features/people/services/fetch-person.service";
import { fetchSystemRoles } from "@features/people/services/fetch-system-roles.service";
import { PeopleScope } from "@features/people/utils/people-scope.util";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

type EditPersonPageProps = {
  params: Promise<{ id: string; personId: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue; view?: QueryParamValue }>;
};

export async function generateMetadata({ searchParams }: Pick<EditPersonPageProps, "searchParams">): Promise<Metadata> {
  const { view } = await searchParams;

  const title = view === "detail" ? "Detalle de usuario" : "Editar usuario";

  return { title, other: { "application-title": title } };
}

export default async function EditPersonPage({ params, searchParams }: EditPersonPageProps): Promise<ReactElement> {
  const { id, personId } = await params;

  const { returnTo, view } = await searchParams;

  const isDetailView = view === "detail";

  const destination = getSafeReturnTo(returnTo, `/institutions/${id}/people`);

  const [person, assignedRoles] = await Promise.all([fetchPerson(id, personId), fetchPersonRoles(id, personId)]);

  const systemRoles = isDetailView
    ? []
    : await fetchSystemRoles(
        id,
        PeopleScope.ADMIN,
        assignedRoles.map((role) => role.roleId),
      );

  if (!person) {
    notFound();
  }

  const personName = `${person.firstName} ${person.lastName}`;

  const accessButton = (
    <PersonAccessButton
      email={person.email}
      institutionId={id}
      personId={personId}
      personName={personName}
      scope={PeopleScope.ADMIN}
      className="flex-1 md:flex-none"
    />
  );

  return (
    <PlatformPageShell
      title={isDetailView ? "Detalle de usuario" : "Editar usuario"}
      minViewportHeight
      breadcrumb={
        <PlatformBreadcrumb
          segmentHrefs={{
            [personId]: appendReturnTo(`/institutions/${id}/people/${personId}?view=detail`, destination),
          }}
          segmentLabels={{ [id]: person.institutionName, [personId]: personName }}
          trailingLabel={isDetailView ? undefined : "Editar"}
        />
      }
      headerClassName="flex-row items-center justify-between"
      actionsClassName="self-stretch"
      actions={<PlatformPageIcon icon={UserRoundPenIcon} />}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button asChild variant="outline" size="lg" className="self-start">
          <Link href={destination}>Volver</Link>
        </Button>
        <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">
          {accessButton}
          {isDetailView ? (
            <Button asChild size="lg" className="flex-1 md:flex-none">
              <Link href={appendReturnTo(`/institutions/${id}/people/${personId}`, destination)}>Editar</Link>
            </Button>
          ) : (
            <PersonDeleteButton institutionId={id} personId={personId} personName={personName} className="flex-1 md:flex-none" />
          )}
        </div>
      </div>

      {isDetailView ? (
        <PersonDetailView person={person} assignedRoles={assignedRoles} />
      ) : (
        <PersonEditForm
          formId="person-edit-form"
          institutionId={id}
          person={person}
          roles={systemRoles}
          assignedRoles={assignedRoles}
          returnTo={destination}
        />
      )}
    </PlatformPageShell>
  );
}
