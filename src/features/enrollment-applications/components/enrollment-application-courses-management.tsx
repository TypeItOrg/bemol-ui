"use client";

import { useState, type ReactElement } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { BookOpenIcon, EllipsisIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";
import { Card, CardContent } from "@common/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@common/components/ui/dropdown-menu";

import { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { formatStudyPlanNameWithPrefix } from "@features/academic/utils/study-plan-label.util";
import { EnrollmentApplicationCourseDialog } from "@features/enrollment-applications/components/enrollment-application-course-dialog";
import { EnrollmentCourseAvailability } from "@features/enrollment-applications/components/enrollment-course-availability";
import { EnrollmentStepCardHeader } from "@features/enrollment-applications/components/enrollment-step-card-header";
import { RejectEnrollmentApplicationCourseDialog } from "@features/enrollment-applications/components/reject-enrollment-application-course-dialog";
import type { EnrollmentApplicationCourse } from "@features/enrollment-applications/types/enrollment-application-course.types";

type EnrollmentApplicationCoursesManagementProps = {
  applicationId: string;
  institutionId?: string;
  scope?: AcademicScope;
  courses: readonly EnrollmentApplicationCourse[];
  canEnroll: boolean;
  canReject: boolean;
  canReadWaitlist: boolean;
  readOnly?: boolean;
  showAvailability?: boolean;
};

const STATUS_LABELS: Record<EnrollmentApplicationCourse["status"], string> = {
  PENDING: "Pendiente",
  WAITLISTED: "En lista de espera",
  ENROLLED: "Inscripta",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};

export function EnrollmentApplicationCoursesManagement({
  applicationId,
  institutionId,
  scope = AcademicScope.INSTITUTIONAL,
  courses,
  canEnroll,
  canReject,
  canReadWaitlist,
  readOnly = false,
  showAvailability = false,
}: EnrollmentApplicationCoursesManagementProps): ReactElement | null {
  const router = useRouter();

  const queryClient = useQueryClient();

  const [courseToEnroll, setCourseToEnroll] = useState<EnrollmentApplicationCourse>();

  const [courseToReject, setCourseToReject] = useState<EnrollmentApplicationCourse>();

  function handleResolved(): void {
    void queryClient.invalidateQueries({ queryKey: ["course-enrollment-options", scope, institutionId] });
    router.refresh();
  }

  if (courses.length === 0) {
    return null;
  }

  const waitlistHref = (courseId: string) =>
    scope === AcademicScope.ADMIN && institutionId
      ? `/course-enrollments/${courseId}/waitlist?institutionId=${institutionId}`
      : `/course-enrollments/${courseId}/waitlist`;

  return (
    <Card className="bg-muted/25 sm:[--card-spacing:--spacing(6)]" role="region" aria-labelledby="application-courses-title">
      <EnrollmentStepCardHeader
        icon={BookOpenIcon}
        title="Solicitudes de cursada"
        titleId="application-courses-title"
        description={
          readOnly
            ? "Consultá el estado de cada curso solicitado y cualquier motivo informado por la institución."
            : "Gestioná cada curso de forma independiente después de aprobar la documentación."
        }
      />

      <CardContent className="grid gap-3">
        {courses.map((course) => {
          const isPending = course.status === "PENDING" || course.status === "WAITLISTED";

          const canEnrollCourse = !readOnly && canEnroll && isPending;

          const canRejectCourse = !readOnly && canReject && isPending;

          return (
            <article key={course.applicationCourseId} className="bg-background @container/application-course rounded-xl border p-4">
              <div className="grid grid-cols-1 gap-3 @md/application-course:grid-cols-[minmax(0,1fr)_auto] @md/application-course:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 font-semibold break-words">{course.academicSpaceName}</h3>
                    <Badge variant={getCourseStatusVariant(course.status)}>{STATUS_LABELS[course.status]}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {course.academicYear ? `Ciclo ${course.academicYear} · ` : ""}
                    {formatStudyPlanNameWithPrefix(course)} · {course.academicLevelName ?? "Sin nivel"}
                    {course.instrumentName ? ` · ${course.instrumentName}` : ""}
                  </p>
                  {course.status === "WAITLISTED" && course.waitlistNumber !== null ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Número de ingreso a la lista de espera: <span className="font-medium">{course.waitlistNumber}</span>
                      <span className="block">No indica tu posición actual.</span>
                    </p>
                  ) : null}
                  {course.resolutionReasonText ? <p className="text-destructive mt-1 text-sm">{course.resolutionReasonText}</p> : null}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 empty:hidden">
                  {canEnrollCourse ? (
                    <Button size="lg" className="flex-1 @md/application-course:flex-none" onClick={() => setCourseToEnroll(course)}>
                      Inscribir
                    </Button>
                  ) : null}
                  {canReadWaitlist || canRejectCourse ? (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-lg" aria-label={`Más acciones para ${course.academicSpaceName}`}>
                          <EllipsisIcon aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-max min-w-48 p-1.5">
                        {canReadWaitlist ? (
                          <DropdownMenuItem asChild>
                            <Link href={waitlistHref(course.courseId)} className="px-2.5 py-1.5">
                              Ver lista de espera
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {canReadWaitlist && canRejectCourse ? <DropdownMenuSeparator /> : null}
                        {canRejectCourse ? (
                          <DropdownMenuItem variant="destructive" className="px-2.5 py-1.5" onSelect={() => setCourseToReject(course)}>
                            Rechazar solicitud de cursada
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </div>
              {showAvailability ? <EnrollmentCourseAvailability courseId={course.courseId} institutionId={institutionId} scope={scope} /> : null}
            </article>
          );
        })}
      </CardContent>

      {!readOnly && courseToEnroll ? (
        <EnrollmentApplicationCourseDialog
          applicationId={applicationId}
          institutionId={institutionId}
          scope={scope}
          course={courseToEnroll}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCourseToEnroll(undefined);
            }
          }}
          onResolved={handleResolved}
        />
      ) : null}
      {!readOnly && courseToReject ? (
        <RejectEnrollmentApplicationCourseDialog
          applicationId={applicationId}
          institutionId={institutionId}
          scope={scope}
          course={courseToReject}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCourseToReject(undefined);
            }
          }}
          onResolved={handleResolved}
        />
      ) : null}
    </Card>
  );
}

function getCourseStatusVariant(status: EnrollmentApplicationCourse["status"]): "success" | "destructive" | "outline" {
  switch (status) {
    case "ENROLLED":
      return "success";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

export { EnrollmentApplicationCourseDialog } from "@features/enrollment-applications/components/enrollment-application-course-dialog";
