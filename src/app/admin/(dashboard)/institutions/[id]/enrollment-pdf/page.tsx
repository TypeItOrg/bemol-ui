import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FileTextIcon } from "lucide-react";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { EnrollmentPdfSettingsForm } from "@features/enrollment-pdf/components/enrollment-pdf-settings-form";
import { fetchEnrollmentPdfSettings } from "@features/enrollment-pdf/services/enrollment-pdf-settings.service";
import { fetchInstitution } from "@features/institutions/services/fetch-institution.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Planilla de inscripción", other: { "application-title": "Planilla de inscripción" } };

export default async function PlatformEnrollmentPdfSettingsPage({
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

  const settings = await fetchEnrollmentPdfSettings("platform", id);

  return (
    <PlatformPageShell
      title="Planilla de inscripción"
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [id]: institution.name, "enrollment-pdf": "Planilla de inscripción" }} />}
      actions={<PlatformPageIcon icon={FileTextIcon} />}
    >
      <EnrollmentPdfSettingsForm institutionId={id} scope="platform" settings={settings} returnTo={destination} />
    </PlatformPageShell>
  );
}
