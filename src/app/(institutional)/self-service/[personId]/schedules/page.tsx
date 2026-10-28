import type { ReactElement } from "react";

import type { Metadata } from "next";

import { CalendarRangeIcon } from "lucide-react";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { parseHttpResponse } from "@common/utils/http-response-error.util";

import { formatStudyPlanLabel } from "@features/academic/utils/study-plan-label.util";
import { MyWeeklySchedule } from "@features/course-enrollments/components/my-weekly-schedule";
import { fetchMyWeeklySchedules } from "@features/course-enrollments/services/my-schedules.service";
import type { WeeklyScheduleItem } from "@features/course-enrollments/types/weekly-schedule-item.types";
import { getScheduleWeek } from "@features/course-enrollments/utils/schedule-week.util";
import { getSelfServiceApiPath } from "@features/guardian-workspace/services/operating-profile.service";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";
import { canViewOwnFormation } from "@features/institutional-auth/utils/institutional-applicant-role.util";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata: Metadata = { title: "Mis horarios", other: { "application-title": "Mis horarios" } };

export default async function MySchedulesPage({
  searchParams,
  params,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ week?: string | string[] }>;
}): Promise<ReactElement> {
  const { personId } = await params;

  const user = await requireInstitutionalUser();

  if (!canViewOwnFormation(user)) {
    return <InstitutionalAccessDenied description="Esta sección corresponde a estudiantes." />;
  }

  const referenceDate = new Date().toISOString();

  const query = await searchParams;

  const week = getScheduleWeek(query.week, referenceDate);

  const data = await parseHttpResponse<Awaited<ReturnType<typeof fetchMyWeeklySchedules>>>(
    await institutionalApiFetch(`${await getSelfServiceApiPath(personId)}/schedules?week=${week}`),
    "No se pudieron cargar los horarios.",
  );

  const items: WeeklyScheduleItem[] = data.enrollments.map((enrollment) => ({
    id: enrollment.id,
    title: enrollment.academicSpaceName,
    instrumentName: enrollment.instrumentName,
    context: [formatStudyPlanLabel(enrollment), enrollment.academicLevelName].filter(Boolean).join(" · "),
    schedules: enrollment.schedules,
  }));

  return (
    <PlatformPageShell
      minViewportHeight
      title="Mis horarios"
      breadcrumb={<InstitutionalBreadcrumb />}
      actions={<PlatformPageIcon icon={CalendarRangeIcon} />}
    >
      <DataTableNavigationProvider>
        <MyWeeklySchedule items={items} referenceDate={referenceDate} weekStart={data.weekStart} />
      </DataTableNavigationProvider>
    </PlatformPageShell>
  );
}
