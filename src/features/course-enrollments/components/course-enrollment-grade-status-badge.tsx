"use client";

import type { ReactElement } from "react";

import { ClockIcon } from "lucide-react";

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
        <ClockIcon className="size-3.5" aria-hidden="true" />
        {COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === COURSE_ENROLLMENT_GRADE_STATUS.PENDING_DELETION) {
    return <Badge variant="destructive">{COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}</Badge>;
  }

  return <Badge variant="outline">{COURSE_ENROLLMENT_GRADE_STATUS_LABELS[status]}</Badge>;
}
