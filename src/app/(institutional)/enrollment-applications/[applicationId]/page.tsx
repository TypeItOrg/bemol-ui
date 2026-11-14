import type { ReactElement } from "react";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClipboardListIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { EnrollmentApplicationResolvePanel } from "@features/enrollment-applications/components/enrollment-application-resolve-panel";
import { EnrollmentStatusCard } from "@features/enrollment-applications/components/EnrollmentStatusCard";
import { fetchInstitutionalEnrollmentApplicationById } from "@features/enrollment-applications/services/enrollment-application.service";
import { ENROLLMENT_APPLICATION_STATUS } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { EnrollmentPdfExport } from "@features/enrollment-pdf/components/enrollment-pdf-export";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { hasInstitutionalPermission, hasTrainingPathPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

type EnrollmentApplicationDetailPageProps = {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ returnTo?: QueryParamValue }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return getInstitutionalMetadata("Detalle de solicitud de inscripción");
}

export default async function EnrollmentApplicationDetailPage({ params, searchParams }: EnrollmentApplicationDetailPageProps): Promise<ReactElement> {
  const [{ applicationId }, { returnTo }, user] = await Promise.all([params, searchParams, requireInstitutionalUser()]);

  if (!hasInstitutionalPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_READ)) {
    return <InstitutionalAccessDenied description="No tenés permisos para consultar solicitudes de inscripción." />;
  }

  const destination = getSafeReturnTo(returnTo, "/enrollment-applications");

  const application = await fetchInstitutionalEnrollmentApplicationById(user.institutionId, applicationId);

  if (!application) {
    notFound();
  }

  const personalData = application.data?.personalData;

  const personalDataName = `${personalData?.firstName || ""} ${personalData?.lastName || ""}`.trim();

  const applicantName = application.applicantName || personalDataName || "Solicitante";

  const reviewSummary = {
    institutionId: user.institutionId,
    applicationId,
    canApproveProvisionally: application.canApproveProvisionally,
    canConfirm: application.canConfirm,
    applicantName,
  };

  const canApprove = hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_APPROVE, application.trainingPathId ?? "");

  const canReject = hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_REJECT, application.trainingPathId ?? "");

  const showApproveAction =
    canApprove &&
    (application.status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED || application.status === ENROLLMENT_APPLICATION_STATUS.PROVISIONALLY_APPROVED) &&
    Boolean(application.canApproveProvisionally || application.canConfirm);

  const showRejectAction = canReject && application.status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED;

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
        <InstitutionalBreadcrumb
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
            href={`/api/institutional/enrollment-applications/${applicationId}/pdf`}
            status={application.status}
          />
          <EnrollmentApplicationResolvePanel application={reviewSummary} status={application.status} canApprove={canApprove} canReject={canReject} />
        </div>
      </div>

      <EnrollmentStatusCard
        application={application}
        showApplicantGuidance={false}
        showRequirementChanges
        administrativeView
        scope={AcademicScope.INSTITUTIONAL}
        canManageCourses={
          hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_COURSE_READ, application.trainingPathId ?? "") ||
          hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_COURSE_ENROLL, application.trainingPathId ?? "") ||
          hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_COURSE_REJECT, application.trainingPathId ?? "")
        }
        canEnrollCourses={hasTrainingPathPermission(
          user,
          INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_COURSE_ENROLL,
          application.trainingPathId ?? "",
        )}
        canRejectCourses={hasTrainingPathPermission(
          user,
          INSTITUTIONAL_PERMISSION.ENROLLMENT_APPLICATION_COURSE_REJECT,
          application.trainingPathId ?? "",
        )}
        canReadCourseWaitlist={hasTrainingPathPermission(user, INSTITUTIONAL_PERMISSION.COURSE_WAITLIST_READ, application.trainingPathId ?? "")}
      />
    </PlatformPageShell>
  );
}
