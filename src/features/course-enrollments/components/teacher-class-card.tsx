import type { ReactElement } from "react";

import { ChevronRightIcon } from "lucide-react";

import { FadeImage } from "@common/components/fade-image";
import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { Button } from "@common/components/ui/button";

import { DEFAULT_INSTRUMENT_ICON, INSTRUMENT_ICONS } from "@features/academic/constants/instrument-icon.constants";
import { courseWeekDayLabels } from "@features/academic/utils/academic-labels.util";
import type { TeacherCourseClass } from "@features/course-enrollments/types/teacher-course-class.types";
import { getClassCover } from "@features/course-enrollments/utils/class-cover.util";

export function TeacherClassCard({ item }: { item: TeacherCourseClass }): ReactElement {
  const { icon: InstrumentIcon } = INSTRUMENT_ICONS[item.instrumentIcon ?? DEFAULT_INSTRUMENT_ICON];

  const titleId = `teacher-class-${item.courseClass.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="bg-background flex min-w-0 flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="bg-muted relative h-32 shrink-0">
        <FadeImage
          src={getClassCover(item.courseId)}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 pb-5">
        <span className="bg-primary text-primary-foreground ring-background relative -mt-7 flex size-14 shrink-0 items-center justify-center rounded-full shadow-md ring-4">
          <InstrumentIcon className="size-6" aria-hidden="true" />
        </span>

        <div className="min-w-0 space-y-1">
          {item.instrumentName ? <p className="text-primary text-xs font-semibold tracking-wide uppercase">{item.instrumentName}</p> : null}
          <h2 id={titleId} className="text-lg leading-snug font-semibold tracking-tight wrap-break-word">
            {item.academicSpaceName}
          </h2>
          <p className="text-muted-foreground text-sm">{item.classLabel}</p>
        </div>

        <ul className="mt-auto divide-y rounded-lg border">
          {item.courseClass.days.flatMap((day) =>
            day.schedules.map((schedule) => (
              <li key={`${day.dayOfWeek}-${schedule.startTime}`} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <span className="font-medium">{courseWeekDayLabels[day.dayOfWeek]}</span>
                <span className="text-muted-foreground tabular-nums">
                  {schedule.startTime.slice(0, 5)}–{schedule.endTime.slice(0, 5)}
                </span>
              </li>
            )),
          )}
        </ul>
      </div>

      <div className="border-t">
        <Button asChild variant="ghost" className="h-12 w-full justify-between rounded-none px-5">
          <ReturnToLink href={`/my-teaching/classes/${item.courseClass.id}`}>
            Ver cursadas
            <ChevronRightIcon aria-hidden="true" />
          </ReturnToLink>
        </Button>
      </div>
    </article>
  );
}
