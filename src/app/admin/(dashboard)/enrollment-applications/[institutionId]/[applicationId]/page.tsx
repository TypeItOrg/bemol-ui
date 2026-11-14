import type { ReactElement } from "react";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClipboardListIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { EnrollmentStatusCard } from "@features/enrollment-applications/components/EnrollmentStatusCard";
import { PlatformEnrollmentApplicationResolvePanel } from "@features/enrollment-applications/components/platform-enrollment-application-resolve-panel";
import { fetchPlatformEnrollmentApplicationById } from "@features/enrollment-applications/services/enrollment-application.service";
import { ENROLLMENT_APPLICATION_STATUS } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { EnrollmentPdfExport } from "@features/enrollment-pdf/components/enrollment-pdf-export";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = {
  title: "Detalle de solicitud de inscripción",
  other: { "application-title": "Detalle de solicitud de inscripción" },
};

type PlatformEnrollmentApplicationDetailPageProps = {
  params: Promise<{ institutionId: string; applicationId: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
};

export default async function PlatformEnrollmentApplicationDetailPage({
  params,
  searchParams,
}: PlatformEnrollmentApplicationDetailPageProps): Promise<ReactElement> {
  const [{ institutionId, applicationId }, { returnTo }] = await Promise.all([params, searchParams]);

  const destination = getSafeReturnTo(returnTo, "/enrollment-applications");

  const application = await fetchPlatformEnrollmentApplicationById(institutionId, applicationId);

  if (!application) {
    notFound();
  }

  const personalData = application.data?.personalData;

  const personalDataName = `${personalData?.firstName || ""} ${personalData?.lastName || ""}`.trim();

  const applicantName = application.applicantName || personalDataName || "Solicitante";

  const showApproveAction =
    (application.status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED || application.status === ENROLLMENT_APPLICATION_STATUS.PROVISIONALLY_APPROVED) &&
    Boolean(application.canApproveProvisionally || application.canConfirm);

  const showRejectAction = application.status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED;

  const resolveActionCount = Number(showApproveAction) + Number(showRejectAction);

  const actionClassesByCount: Record<number, { row: string; group: string; button: string }> = {
    2: {
      row: "flex flex-col gap-3 @2xl/page-shell:flex-row @2xl/page-shell:items-center @2xl/page-shell:justify-between",
      group: "flex w-full min-w-0 flex-col gap-3 @2xl/page-shell:w-auto @2xl/page-shell:flex-row @2xl/page-shell:items-center",
      button: "w-full @2xl/page-shell:w-auto",
    },
    1: {
      row: "flex flex-col gap-3 @lg/page-shell:flex-row @lg/page-shell:items-center @lg/page-shell:justify-between",
      group: "flex w-full min-w-0 flex-col gap-3 @lg/page-shell:w-auto @lg/page-shell:flex-row @lg/page-shell:items-center",
      button: "w-full @lg/page-shell:w-auto",
    },
    0: {
      row: "flex flex-col gap-3 @xs/page-shell:flex-row @xs/page-shell:items-center @xs/page-shell:justify-between",
      group: "flex w-full min-w-0 flex-col gap-3 @xs/page-shell:w-auto @xs/page-shell:flex-row @xs/page-shell:items-center",
      button: "w-full @xs/page-shell:w-auto",
    },
  };

  const { row: actionRowClassName, group: actionGroupClassName, button: actionButtonClassName } = actionClassesByCount[resolveActionCount];

  return (
    <PlatformPageShell
      title="Detalle de solicitud de inscripción"
      breadcrumb={
        <PlatformBreadcrumb
          hiddenSegments={[institutionId]}
          segmentLabels={{
            [applicationId]: "Detalle de solicitud de inscripción",
          }}
        />
      }
      actions={<PlatformPageIcon icon={ClipboardListIcon} />}
    >
      <div className={actionRowClassName}>
        <Button asChild variant="outline" size="lg" className={actionButtonClassName}>
          <Link href={destination}>Volver</Link>
        </Button>

        <div className={actionGroupClassName}>
          <EnrollmentPdfExport
            className={actionButtonClassName}
            href={`/api/admin/enrollment-applications/${institutionId}/${applicationId}/pdf`}
            status={application.status}
          />
          <PlatformEnrollmentApplicationResolvePanel
            application={{
              institutionId,
              applicationId,
              canApproveProvisionally: application.canApproveProvisionally,
              canConfirm: application.canConfirm,
              applicantName,
            }}
            status={application.status}
          />
        </div>
      </div>

      <EnrollmentStatusCard
        application={application}
        showApplicantGuidance={false}
        showRequirementChanges
        administrativeView
        scope={AcademicScope.ADMIN}
        institutionId={institutionId}
        canManageCourses
        canEnrollCourses
        canRejectCourses
        canReadCourseWaitlist
      />
    </PlatformPageShell>
  );
}
