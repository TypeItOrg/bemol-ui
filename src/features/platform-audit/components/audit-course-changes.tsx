import type { ReactElement } from "react";

import { COURSE_DAY_LABELS } from "@features/course-enrollments/constants/course-enrollment.constants";
import type { AuditComparisonRow } from "@features/platform-audit/types/audit-comparison-row.types";
import type { AuditEntityChange } from "@features/platform-audit/types/audit-entity-change.types";
import type { AuditHistory } from "@features/platform-audit/types/audit-history.types";

type DayState = { capacity: string | null; duration: string | null; schedules: string[] };
type ClassState = { teachers: string[]; days: Map<string, DayState> };

export function auditCourseRows(history: AuditHistory): AuditComparisonRow[] {
  const before = classState(history, "before");

  const after = classState(history, "after");

  const rows: AuditComparisonRow[] = [];

  // Class numbers and weekdays identify configuration slots, not continuity of replaced database IDs.
  for (const number of [...new Set([...before.keys(), ...after.keys()])].sort((a, b) => Number(a) - Number(b))) {
    const previous = before.get(number);

    const current = after.get(number);

    const oldTeachers = previous?.teachers.sort() ?? [];

    const newTeachers = current?.teachers.sort() ?? [];

    if (oldTeachers.join(",") !== newTeachers.join(",")) {
      const sameCount = oldTeachers.length === newTeachers.length;

      rows.push({
        key: `class-${number}:teachers`,
        label: fieldLabel("Docentes", `Clase ${number}`),
        before: previous
          ? `${oldTeachers.length} ${oldTeachers.length === 1 ? "docente" : "docentes"}${sameCount ? " · asignación anterior" : ""}`
          : "No existía",
        after: current
          ? `${newTeachers.length} ${newTeachers.length === 1 ? "docente" : "docentes"}${sameCount ? " · asignación nueva" : ""}`
          : "No existe",
      });
    }

    for (const day of new Set([...(previous?.days.keys() ?? []), ...(current?.days.keys() ?? [])])) {
      const oldDay = previous?.days.get(day);

      const newDay = current?.days.get(day);

      const context = `Clase ${number} · ${COURSE_DAY_LABELS[day as keyof typeof COURSE_DAY_LABELS] ?? day}`;

      for (const [key, label, oldValue, newValue] of [
        ["capacity", "Cupo", oldDay ? (oldDay.capacity ?? "Sin límite") : "No existía", newDay ? (newDay.capacity ?? "Sin límite") : "No existe"],
        [
          "duration",
          "Duración del turno (minutos)",
          oldDay ? (oldDay.duration ?? "No corresponde") : "No existía",
          newDay ? (newDay.duration ?? "No corresponde") : "No existe",
        ],
        [
          "schedules",
          "Horarios",
          oldDay ? oldDay.schedules.sort().join("\n") || "Sin horarios" : "No existía",
          newDay ? newDay.schedules.sort().join("\n") || "Sin horarios" : "No existe",
        ],
      ]) {
        if (key === "duration" && !oldDay?.duration && !newDay?.duration) {
          continue;
        }

        if (oldValue !== newValue) {
          rows.push({ key: `class-${number}:${day}:${key}`, label: fieldLabel(label, context), before: oldValue, after: newValue });
        }
      }
    }
  }

  return rows;
}

function classState(history: AuditHistory, side: "before" | "after"): Map<string, ClassState> {
  // Only creations/deletions carry complete snapshots. Partial updates must not invent missing context.
  const snapshots = history.changes.filter((change) => change.operation === (side === "before" ? "DELETED" : "CREATED"));

  const classes = new Map<string, string>();

  const result = new Map<string, ClassState>();

  for (const change of snapshots.filter((item) => item.entity === "Clase")) {
    const number = value(change, "class_number", side);

    if (number !== null) {
      classes.set(change.entityId, number);
      result.set(number, { teachers: [], days: new Map() });
    }
  }

  for (const change of snapshots.filter((item) => item.entity === "Docente de clase")) {
    const number = classes.get(value(change, "course_class_id", side) ?? "");

    const person = value(change, "person_id", side);

    if (number !== undefined && person !== null) {
      result.get(number)?.teachers.push(person);
    }
  }

  const days = new Map<string, DayState>();

  for (const change of snapshots.filter((item) => item.entity === "Día de clase")) {
    const number = classes.get(value(change, "course_class_id", side) ?? "");

    const weekday = value(change, "day_of_week", side);

    if (number === undefined || weekday === null) {
      continue;
    }

    const day: DayState = { capacity: value(change, "capacity", side), duration: value(change, "period_duration_minutes", side), schedules: [] };

    days.set(change.entityId, day);
    result.get(number)?.days.set(weekday, day);
  }

  for (const change of snapshots.filter((item) => item.entity === "Horario de clase")) {
    const day = days.get(value(change, "course_class_day_id", side) ?? "");

    const start = value(change, "start_time", side);

    const end = value(change, "end_time", side);

    if (day && start !== null && end !== null) {
      day.schedules.push(`${start}–${end}`);
    }
  }

  return result;
}

function value(change: AuditEntityChange, field: string, side: "before" | "after"): string | null {
  return change.fields.find((item) => item.field === field)?.[side] ?? null;
}

function fieldLabel(label: string, context: string): ReactElement {
  return (
    <>
      <span>{label}</span>
      <span className="text-muted-foreground mt-1 block text-xs font-normal">{context}</span>
    </>
  );
}
