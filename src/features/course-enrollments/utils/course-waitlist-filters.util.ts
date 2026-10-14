import { z } from "zod";

import type { CourseWaitlistFilters } from "@features/course-enrollments/types/course-waitlist-filters.types";

const courseWaitlistFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  capacity: z.enum(["available", "full"]).optional(),
  shift: z.string().trim().min(1).max(150).optional(),
});

export function parseCourseWaitlistFilters(params: Record<string, unknown>) {
  return courseWaitlistFiltersSchema.safeParse({
    search: params.search === "" ? undefined : params.search,
    capacity: params.capacity === "all" || params.capacity === "" ? undefined : params.capacity,
    shift: params.shift === "all" || params.shift === "" ? undefined : params.shift,
  });
}

export function createCourseWaitlistSearchParams(filters: CourseWaitlistFilters = {}): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.capacity) {
    params.set("capacity", filters.capacity.toUpperCase());
  }

  if (filters.shift) {
    params.set("shift", filters.shift);
  }

  return params;
}
