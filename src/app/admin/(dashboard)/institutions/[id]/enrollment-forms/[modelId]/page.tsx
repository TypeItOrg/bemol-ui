import type { ReactElement } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { QueryParamValue } from "@common/types/query-param.types";
import { getQueryParamValue } from "@common/utils/query-param.util";
import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { EnrollmentFormDetail } from "@features/enrollment-forms/components/enrollment-form-detail";
import { fetchInstitution } from "@features/institutions/services/fetch-institution.service";

export const metadata: Metadata = { title: "Formulario de inscripción", other: { "application-title": "Formulario de inscripción" } };

export default async function PlatformEnrollmentFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; modelId: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue; versionId?: QueryParamValue }>;
}): Promise<ReactElement> {
  const [{ id, modelId }, { returnTo, versionId }] = await Promise.all([params, searchParams]);

  const initialVersionId = getQueryParamValue(versionId);

  if (!isValidUuid(id) || !isValidUuid(modelId) || (initialVersionId !== undefined && !isValidUuid(initialVersionId))) {
    notFound();
  }

  const institution = await fetchInstitution(id);

  if (!institution) {
    notFound();
  }

  const destination = getSafeReturnTo(returnTo, `/institutions/${id}/enrollment-forms`);

  return (
    <EnrollmentFormDetail
      key={`${modelId}:${initialVersionId ?? "latest"}`}
      context={{ institutionId: id, scope: "platform", canUpdate: true }}
      institutionName={institution.name}
      modelId={modelId}
      returnTo={destination}
      versionId={initialVersionId}
    />
  );
}
