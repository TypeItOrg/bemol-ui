import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";

export function getSubjectCover(enrollment: Pick<CourseEnrollment, "academicSpaceName" | "instrumentName">): string {
  const instrument = enrollment.instrumentName?.trim().toLocaleLowerCase("es");

  const subject = enrollment.academicSpaceName.toLocaleLowerCase("es");

  if (instrument === "piano") {
    return "/images/subjects/piano.webp";
  }

  if (/ensamble|coro|orquesta|conjunto/.test(subject)) {
    return "/images/subjects/ensemble.webp";
  }

  return "/images/subjects/score.webp";
}
