import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateCourseEnrollmentViews(): void {
  revalidatePath("/course-enrollments");
  revalidatePath("/(institutional)/course-enrollments/[id]", "page");
  revalidatePath("/my-teaching");
  revalidatePath("/(institutional)/my-teaching/classes/[classId]", "page");
  revalidatePath("/(institutional)/my-teaching/classes/[classId]/enrollments/[id]", "page");
  revalidatePath("/(institutional)/self-service/[personId]/courses", "page");
  revalidatePath("/(institutional)/self-service/[personId]/schedules", "page");
}
