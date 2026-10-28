import type { ReactElement } from "react";

import { ClockIcon, Music2Icon } from "lucide-react";

import { FadeImage } from "@common/components/fade-image";
import { Badge } from "@common/components/ui/badge";
import { Button } from "@common/components/ui/button";

import { COURSE_DAY_LABELS } from "@features/course-enrollments/constants/course-enrollment.constants";
import { MY_SUBJECTS_MESSAGES } from "@features/course-enrollments/constants/my-subjects.constants";
import { COURSE_ENROLLMENT_STATUS } from "@features/course-enrollments/types/course-enrollment-status.types";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import { getCourseEnrollmentSituationLabel } from "@features/course-enrollments/utils/course-enrollment-situation.util";
import { getSubjectCover } from "@features/course-enrollments/utils/subject-cover.util";

type MySubjectCardProps = {
  enrollment: CourseEnrollment;
  canWithdraw: boolean;
  canUpdateAcademicStatus: boolean;
  onMutation: (enrollment: CourseEnrollment, mode: "withdraw" | "academic") => void;
};

export function MySubjectCard({ enrollment, canWithdraw, canUpdateAcademicStatus, onMutation }: MySubjectCardProps): ReactElement {
  const isEnrolled = enrollment.status === COURSE_ENROLLMENT_STATUS.ENROLLED;

  const isWithdrawn =
    enrollment.status === COURSE_ENROLLMENT_STATUS.WITHDRAWN || enrollment.status === COURSE_ENROLLMENT_STATUS.ADMINISTRATIVELY_WITHDRAWN;

  const showWithdraw = canWithdraw && isEnrolled;

  const showAcademicAction = canUpdateAcademicStatus && !isWithdrawn;

  const days = Object.keys(COURSE_DAY_LABELS);

  const schedules = enrollment.schedules
    .filter((schedule) => !isEnrolled || !schedule.releasedAt)
    .toSorted((a, b) => days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime));

  return (
    <article className="bg-background flex min-w-0 flex-col overflow-hidden rounded-xl border">
      <div className="bg-muted relative h-40 shrink-0">
        <FadeImage
          src={getSubjectCover(enrollment)}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          className="object-cover"
        />
        {enrollment.instrumentName ? (
          <div className="absolute inset-x-4 bottom-4 flex">
            <Badge variant="outline" className="bg-background h-auto max-w-full items-start gap-1.5 rounded-lg px-3 py-1.5 whitespace-normal">
              <Music2Icon className="mt-1 shrink-0" aria-hidden="true" />
              <span className="min-w-0 wrap-break-word">{enrollment.instrumentName}</span>
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-5 p-5">
        <div className="space-y-2">
          {!isEnrolled ? (
            <Badge variant="secondary" className="max-w-full whitespace-normal">
              {getCourseEnrollmentSituationLabel(enrollment.status, enrollment.academicStatus)}
            </Badge>
          ) : null}
          <h2 className="text-xl leading-snug font-semibold tracking-tight wrap-break-word">{enrollment.academicSpaceName}</h2>
        </div>
        <dl className="grid min-w-0 gap-2 text-sm">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="text-muted-foreground">{MY_SUBJECTS_MESSAGES.TEACHERS}:</dt>
            <dd className="min-w-0 wrap-break-word">
              {enrollment.teachers?.length ? enrollment.teachers.map((teacher) => teacher.fullName).join(", ") : MY_SUBJECTS_MESSAGES.NO_TEACHERS}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="text-muted-foreground">{MY_SUBJECTS_MESSAGES.CLASS}:</dt>
            <dd className="min-w-0 wrap-break-word">{[enrollment.courseClassLabel, enrollment.academicLevelName].filter(Boolean).join(" · ")}</dd>
          </div>
        </dl>
        <div className="mt-auto min-w-0 border-t pt-4">
          <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-medium">
            <ClockIcon className="size-4 shrink-0" aria-hidden="true" />
            {isEnrolled ? "Horarios" : "Horarios de la cursada"}
          </h3>
          {schedules.length > 0 ? (
            <ul className="space-y-3">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                  <span>
                    {COURSE_DAY_LABELS[schedule.dayOfWeek] ?? schedule.dayOfWeek}
                    {schedule.releasedAt ? <span className="text-muted-foreground"> · Horario liberado</span> : null}
                  </span>
                  <span className="text-lg font-semibold whitespace-nowrap tabular-nums">
                    {schedule.startTime.slice(0, 5)}–{schedule.endTime.slice(0, 5)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              {isEnrolled ? MY_SUBJECTS_MESSAGES.NO_CURRENT_SCHEDULES : MY_SUBJECTS_MESSAGES.NO_HISTORICAL_SCHEDULES}
            </p>
          )}
        </div>
      </div>
      {enrollment.trainingPathName ? (
        <p className="bg-muted/25 text-muted-foreground border-t px-5 py-4 text-sm leading-relaxed wrap-break-word">{enrollment.trainingPathName}</p>
      ) : null}
      {showWithdraw || showAcademicAction ? (
        <div className="flex flex-wrap gap-2 border-t px-5 py-4">
          {showWithdraw ? (
            <Button variant="outline" size="lg" onClick={() => onMutation(enrollment, "withdraw")}>
              Registrar baja
            </Button>
          ) : null}
          {showAcademicAction ? (
            <Button variant="outline" size="lg" onClick={() => onMutation(enrollment, "academic")}>
              Registrar resultado
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
