import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FileTextIcon } from "lucide-react";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { EnrollmentFormWorkspace } from "@features/enrollment-forms/components/enrollment-form-workspace";
import { fetchInstitution } from "@features/institutions/services/fetch-institution.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Formularios de inscripción", other: { "application-title": "Formularios de inscripción" } };

export default async function PlatformEnrollmentFormsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
}): Promise<ReactElement> {
  const [{ id }, { returnTo }] = await Promise.all([params, searchParams]);

  const institution = await fetchInstitution(id);

  if (!institution) {
    notFound();
  }

  const destination = getSafeReturnTo(returnTo, `/institutions/${id}`);

  return (
    <PlatformPageShell
      title="Formularios de inscripción"
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [id]: institution.name, "enrollment-forms": "Formularios de inscripción" }} />}
      actions={<PlatformPageIcon icon={FileTextIcon} />}
    >
      <EnrollmentFormWorkspace context={{ institutionId: id, scope: "platform", canUpdate: true }} returnTo={destination} />
    </PlatformPageShell>
  );
}
