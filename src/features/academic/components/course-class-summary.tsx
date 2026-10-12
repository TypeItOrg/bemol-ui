import type { ReactElement } from "react";

import { CalendarIcon, ClockIcon, UserIcon, UsersIcon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";

import { CourseAvailablePeriods } from "@features/academic/components/course-available-periods";
import type { CourseClass } from "@features/academic/types/course-class.types";
import { COURSE_DAY_LABELS } from "@features/course-enrollments/constants/course-enrollment.constants";
import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";

export function CourseClassSummary({
  courseClass,
  availability,
  format,
  headingLevel = 3,
}: {
  courseClass: {
    label: string;
    teachers: CourseClass["teachers"];
    days: {
      dayOfWeek: string;
      capacity: number | null;
      schedules: { startTime: string; endTime: string }[];
    }[];
  };
  availability?: CourseEnrollmentAssignmentOptions["classes"][number];
  format: CourseEnrollmentAssignmentOptions["format"];
  headingLevel?: 3 | 4;
}): ReactElement {
  const classNumber = courseClass.label.replace(/^Clase /, "");

  const Heading = headingLevel === 3 ? "h3" : "h4";

  const DayHeading = headingLevel === 3 ? "h4" : "h5";

  return (
    <article className="bg-background overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg text-sm font-bold">{classNumber}</span>
          <div>
            <Heading className="text-base leading-none font-semibold">{courseClass.label}</Heading>
            <p className="text-muted-foreground mt-1 text-xs">
              {courseClass.days.length === 0
                ? "Sin días configurados"
                : `${courseClass.days.length} ${courseClass.days.length === 1 ? "día de cursado" : "días de cursado"}`}
            </p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:w-auto">
          {courseClass.teachers.length === 0 ? (
            <span className="text-muted-foreground text-xs italic">Sin docentes asignados</span>
          ) : (
            courseClass.teachers.map((teacher) => (
              <Badge
                key={teacher.personId}
                variant="secondary"
                className="h-auto min-h-8 w-full gap-2 px-3 text-center text-sm font-medium whitespace-normal sm:h-8 sm:w-auto sm:whitespace-nowrap"
              >
                <UserIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{teacher.fullName}</span>
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {courseClass.days.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">Sin días configurados para esta clase.</p>
        ) : (
          <div className="space-y-2.5">
            {courseClass.days.map((day) => {
              const dayLabel = COURSE_DAY_LABELS[day.dayOfWeek] ?? day.dayOfWeek;

              const availableDay = availability?.days.find((item) => item.dayOfWeek === day.dayOfWeek);

              return (
                <div
                  key={day.dayOfWeek}
                  className="bg-muted/15 @container/course-day flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-background text-primary flex size-8 shrink-0 items-center justify-center rounded-lg border">
                      <CalendarIcon className="size-4" aria-hidden="true" />
                    </span>
                    <DayHeading className="text-sm font-semibold sm:text-base">{dayLabel}</DayHeading>
                  </div>
                  <div className="flex w-full min-w-0 flex-wrap items-center gap-2 text-sm tabular-nums sm:w-auto">
                    {day.schedules.length === 0 ? (
                      <span className="text-muted-foreground">Sin horarios configurados</span>
                    ) : (
                      day.schedules.map((schedule, scheduleIndex) => (
                        <Badge
                          key={scheduleIndex}
                          variant="outline"
                          className="bg-background h-auto min-h-8 w-full gap-1.5 px-3 text-center text-sm font-medium whitespace-normal sm:h-8 sm:w-auto sm:whitespace-nowrap"
                        >
                          <ClockIcon className="text-muted-foreground size-4" aria-hidden="true" />
                          {schedule.startTime.slice(0, 5)} a {schedule.endTime.slice(0, 5)}
                        </Badge>
                      ))
                    )}
                  </div>
                  <div
                    role="group"
                    aria-label={`Disponibilidad de ${courseClass.label}, ${dayLabel}`}
                    className="flex w-full min-w-0 flex-wrap items-center gap-2 empty:hidden @3xl/course-day:ml-auto @3xl/course-day:w-auto"
                  >
                    {day.capacity != null ? (
                      <Badge
                        variant="outline"
                        className="bg-background h-auto min-h-8 w-full flex-wrap gap-x-1.5 gap-y-0 px-3 text-center text-sm font-normal whitespace-normal @xs/course-day:w-[calc(50%-0.25rem)] @3xl/course-day:h-8 @3xl/course-day:w-auto @3xl/course-day:flex-nowrap @3xl/course-day:whitespace-nowrap"
                      >
                        <UsersIcon className="text-muted-foreground size-4" aria-hidden="true" />
                        <span className="text-muted-foreground">Total:</span>
                        <strong className="font-semibold whitespace-nowrap tabular-nums">{day.capacity}</strong>
                      </Badge>
                    ) : null}
                    {!availableDay || availableDay.availableCapacity != null ? (
                      <Badge
                        variant="outline"
                        className="bg-background h-auto min-h-8 w-full flex-wrap gap-x-1.5 gap-y-0 px-3 text-center text-sm font-normal whitespace-normal @xs/course-day:w-[calc(50%-0.25rem)] @3xl/course-day:h-8 @3xl/course-day:w-auto @3xl/course-day:flex-nowrap @3xl/course-day:whitespace-nowrap"
                      >
                        <span className="text-muted-foreground">Restantes:</span>
                        <strong className="font-semibold whitespace-nowrap tabular-nums">
                          {availableDay ? availableDay.availableCapacity : "No disponible"}
                        </strong>
                      </Badge>
                    ) : null}
                    {format === "INDIVIDUAL" && availableDay ? (
                      <CourseAvailablePeriods day={availableDay} dayLabel={dayLabel} classLabel={courseClass.label} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
