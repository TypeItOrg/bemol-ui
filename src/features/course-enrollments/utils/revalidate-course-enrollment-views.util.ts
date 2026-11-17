import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateCourseEnrollmentViews(): void {
  revalidatePath("/course-enrollments");
  revalidatePath("/(institutional)/self-service/[personId]/courses", "page");
  revalidatePath("/(institutional)/self-service/[personId]/schedules", "page");
}
