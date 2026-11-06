import type { ReactElement } from "react";

import type { Metadata } from "next";

import { FileTextIcon } from "lucide-react";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { EnrollmentPdfSettingsForm } from "@features/enrollment-pdf/components/enrollment-pdf-settings-form";
import { fetchEnrollmentPdfSettings } from "@features/enrollment-pdf/services/enrollment-pdf-settings.service";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Planilla de inscripción");
}

export default async function EnrollmentPdfSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
}): Promise<ReactElement> {
  const [{ returnTo }, user] = await Promise.all([searchParams, requireInstitutionalUser()]);

  if (!hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE)) {
    return <InstitutionalAccessDenied description="No tenés permisos para personalizar la planilla de inscripción." />;
  }

  const destination = getSafeReturnTo(returnTo, "/institution");

  const settings = await fetchEnrollmentPdfSettings("institutional", user.institutionId);

  return (
    <PlatformPageShell
      title="Planilla de inscripción"
      breadcrumb={<InstitutionalBreadcrumb segmentLabels={{ "enrollment-pdf": "Planilla de inscripción" }} />}
      actions={<PlatformPageIcon icon={FileTextIcon} />}
    >
      <EnrollmentPdfSettingsForm institutionId={user.institutionId} scope="institutional" settings={settings} returnTo={destination} />
    </PlatformPageShell>
  );
}
