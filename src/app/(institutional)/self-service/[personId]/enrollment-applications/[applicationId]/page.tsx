import type { ReactElement } from "react";

import type { Metadata } from "next";
import Link from "next/link";

import { ClipboardListIcon, FilePenLineIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import type { QueryParamValue } from "@common/types/query-param.types";
import { getSafeReturnTo } from "@common/utils/return-to.util";

import { EnrollmentWizard } from "@features/enrollment-applications/components/EnrollmentWizard";
import {
  fetchEnrollmentApplicationById,
  fetchEnrollmentApplicationCourses,
  fetchEnrollmentApplicationShifts,
} from "@features/enrollment-applications/services/enrollment-application.service";
import { ENROLLMENT_APPLICATION_STATUS } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { fetchOperatingProfile } from "@features/guardian-workspace/services/operating-profile.service";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { getInstitutionalMetadata } from "@features/institutional-auth/utils/institutional-metadata.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

interface MyEnrollmentApplicationDetailPageProps {
  params: Promise<{
    applicationId: string;
    personId: string;
  }>;
  searchParams: Promise<{
    returnTo?: QueryParamValue;
  }>;
}

export async function generateMetadata({ params }: Pick<MyEnrollmentApplicationDetailPageProps, "params">): Promise<Metadata> {
  const { applicationId, personId } = await params;

  await requireInstitutionalUser();

  const application = await fetchEnrollmentApplicationById(applicationId, personId).catch(() => null);

  return getInstitutionalMetadata(application?.status === ENROLLMENT_APPLICATION_STATUS.DRAFT ? "Continuar inscripción" : "Detalle de inscripción");
}

export default async function MyEnrollmentApplicationDetailPage({
  params,
  searchParams,
}: MyEnrollmentApplicationDetailPageProps): Promise<ReactElement> {
  const [{ applicationId, personId }, { returnTo }] = await Promise.all([params, searchParams]);

  const destination = getSafeReturnTo(returnTo, `/self-service/${personId}/enrollment-applications`);

  await requireInstitutionalUser();

  const profile = await fetchOperatingProfile(personId);

  const application = await fetchEnrollmentApplicationById(applicationId, personId);

  const isEditable = application.status === ENROLLMENT_APPLICATION_STATUS.DRAFT;

  const detailLabel = isEditable ? "Continuar inscripción" : "Detalle de inscripción";

  const detailContext = [application.trainingPathName, application.academicYear].filter(Boolean).join(" ");

  const breadcrumbLabel = !isEditable && detailContext ? `${detailLabel} · ${detailContext}` : detailLabel;

  const PageIcon = isEditable ? FilePenLineIcon : ClipboardListIcon;

  const [shifts, courses] = await Promise.all([
    isEditable ? fetchEnrollmentApplicationShifts(applicationId, personId) : Promise.resolve([]),
    isEditable
      ? fetchEnrollmentApplicationCourses(applicationId, {}, personId)
      : Promise.resolve({ items: [], page: 0, size: 0, totalItems: 0, totalPages: 0 }),
  ]);

  return (
    <PlatformPageShell
      title={detailLabel}
      minViewportHeight
      breadcrumb={<InstitutionalBreadcrumb segmentLabels={{ [applicationId]: breadcrumbLabel }} />}
      actions={<PlatformPageIcon icon={PageIcon} />}
    >
      {!isEditable ? (
        <div className="flex items-center">
          <Button asChild variant="outline" size="lg">
            <Link href={destination}>Volver</Link>
          </Button>
        </div>
      ) : null}
      <EnrollmentWizard
        actingForOtherPerson={!profile.self}
        initialApplication={application}
        initialShifts={shifts}
        initialCourseOptions={courses.items}
        initialCourseOptionsPage={courses.page}
        initialCourseOptionsTotalPages={courses.totalPages}
        readOnly={!isEditable}
        returnTo={destination}
      />
    </PlatformPageShell>
  );
}
