"use client";

import type { ReactElement } from "react";

import { ClockIcon, ListIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@common/components/ui/dialog";

import type { CourseEnrollmentAssignmentOptions } from "@features/course-enrollments/types/course-enrollment-assignment-options.types";

export function CourseAvailablePeriods({
  day,
  dayLabel,
  classLabel,
}: {
  day: CourseEnrollmentAssignmentOptions["classes"][number]["days"][number];
  dayLabel: string;
  classLabel: string;
}): ReactElement {
  const schedules = day.schedules
    .map((schedule) => ({
      ...schedule,
      individualSlots: schedule.individualSlots
        .filter((slot) => slot.available && day.availableCapacity !== 0)
        .toSorted((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((schedule) => schedule.individualSlots.length > 0)
    .toSorted((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-primary h-11 w-full min-w-0 gap-2 px-3 sm:w-auto"
          aria-label={`Ver períodos disponibles de ${classLabel}, ${dayLabel}`}
        >
          <ListIcon className="size-4" aria-hidden="true" />
          Ver períodos
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0 items-center pt-2 text-center">
          <div className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
            <ListIcon className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle className="leading-snug font-semibold">Períodos disponibles</DialogTitle>
          <DialogDescription className="max-w-sm text-pretty">
            {classLabel} · {dayLabel}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto">
          {schedules.length === 0 ? (
            <p className="text-muted-foreground">No quedan períodos disponibles para este día.</p>
          ) : (
            schedules.map((schedule) => (
              <section key={schedule.id} aria-label={`Horario ${schedule.startTime.slice(0, 5)} a ${schedule.endTime.slice(0, 5)}`}>
                <ul className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
                  {schedule.individualSlots.map((slot) => (
                    <li key={slot.id} className="bg-muted/40 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium tabular-nums">
                      <ClockIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                      {slot.startTime.slice(0, 5)} a {slot.endTime.slice(0, 5)}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <DialogFooter className="shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="lg">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
