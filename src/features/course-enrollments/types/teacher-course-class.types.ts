import type { CourseClass } from "@features/academic/types/course-class.types";
import type { InstrumentIcon } from "@features/academic/types/instrument-icon.types";

export interface TeacherCourseClass {
  courseId: string;
  academicSpaceName: string;
  instrumentName: string | null;
  instrumentIcon: InstrumentIcon | null;
  classLabel: string;
  courseClass: CourseClass;
}
