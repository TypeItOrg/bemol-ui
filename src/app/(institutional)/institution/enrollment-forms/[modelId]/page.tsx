import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getQueryParamValue } from "@common/utils/query-param.util";
import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { EnrollmentFormDetail } from "@features/enrollment-forms/components/enrollment-form-detail";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Formulario de inscripción");
}

export default async function EnrollmentFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ modelId: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue; versionId?: QueryParamValue }>;
}): Promise<ReactElement> {
  const [{ modelId }, { returnTo, versionId }, user] = await Promise.all([params, searchParams, requireInstitutionalUser()]);

  if (!hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.INSTITUTION_READ)) {
    return <InstitutionalAccessDenied description="No tenés permisos para consultar los formularios de inscripción." />;
  }

  const initialVersionId = getQueryParamValue(versionId);

  if (!isValidUuid(modelId) || (initialVersionId !== undefined && !isValidUuid(initialVersionId))) {
    notFound();
  }

  const destination = getSafeReturnTo(returnTo, "/institution/enrollment-forms");

  return (
    <EnrollmentFormDetail
      key={`${modelId}:${initialVersionId ?? "latest"}`}
      context={{
        institutionId: user.institutionId,
        scope: "institutional",
        canUpdate: hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.INSTITUTION_UPDATE),
      }}
      modelId={modelId}
      returnTo={destination}
      versionId={initialVersionId}
    />
  );
}
