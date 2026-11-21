"use client";

import type { ReactElement } from "react";

import { ClockIcon, PencilLineIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@common/components/ui/badge";

import { COURSE_ENROLLMENT_GRADE_STATUS_LABELS } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import {
  COURSE_ENROLLMENT_GRADE_STATUS,
  type CourseEnrollmentGradeStatus,
} from "@features/course-enrollments/types/course-enrollment-grade-status.types";

export function CourseEnrollmentGradeStatusBadge({ status }: { status: CourseEnrollmentGradeStatus }): ReactElement {
  if (status === COURSE_ENROLLMENT_GRADE_STATUS.PUBLISHED) {
    return <Badge variant="success">{COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}</Badge>;
  }

  if (status === COURSE_ENROLLMENT_GRADE_STATUS.DRAFT) {
    return (
      <Badge variant="secondary">
        <ClockIcon aria-hidden="true" />
        {COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === COURSE_ENROLLMENT_GRADE_STATUS.PENDING_DELETION) {
    return (
      <Badge variant="destructive">
        <Trash2Icon aria-hidden="true" />
        {COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300"
    >
      <PencilLineIcon aria-hidden="true" />
      {COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}
    </Badge>
  );
}
