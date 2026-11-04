import { onlineManager } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Course } from "@features/academic/types/course.types";
import { CourseManualEnrollmentStudentFields } from "@features/course-enrollments/components/course-manual-enrollment-student-fields";
import type { ManualEnrollmentCacheScope } from "@features/course-enrollments/types/manual-enrollment-cache-scope.types";
import type { StudentSummary } from "@features/course-enrollments/types/student-summary.types";

import { renderWithQueryClient } from "@/../test/utils/render-with-query-client";

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: jest.requireActual("@/../test/utils/mock-virtualizer").mockVirtualizer,
}));

const initialScope: ManualEnrollmentCacheScope = {
  institutionId: "institution-a",
  userId: "account-a",
  personId: "person-a",
};

const student: StudentSummary = {
  studentId: "student-a",
  personId: "student-person-a",
  firstName: "Ana",
  lastName: "Privada",
  documentNumber: "99000001",
  fileNumber: null,
  status: "ACTIVE",
  enrollmentDate: "2026-01-01",
};

const course: Course = {
  id: "course-a",
  institutionId: "institution-a",
  studyPlanId: "plan-a",
  studyPlanName: "Plan privado",
  trainingPathId: "path-a",
  trainingPathName: "Trayecto privado",
  academicSpaceId: "space-a",
  academicSpaceName: "Curso privado A",
  academicSpaceType: "SUBJECT",
  academicSpaceFormat: "GRUPAL",
  academicYearId: "year-a",
  year: 2026,
  status: "ACTIVE",
  active: true,
  classes: [],
};

function fields(scope: ManualEnrollmentCacheScope) {
  return (
    <CourseManualEnrollmentStudentFields
      {...scope}
      studentId={undefined}
      setStudentId={jest.fn()}
      isPending={false}
      courseId=""
      handleCourseChange={jest.fn()}
    />
  );
}

describe("manual enrollment catalog cache isolation", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    { change: "account", from: initialScope, to: { ...initialScope, userId: "account-b" } },
    { change: "institution", from: initialScope, to: { ...initialScope, institutionId: "institution-b" } },
    { change: "operating person", from: initialScope, to: { ...initialScope, personId: "person-b" } },
    {
      change: "person without an account",
      from: { ...initialScope, userId: null },
      to: { ...initialScope, userId: null, personId: "person-b" },
    },
  ])("does not show cached students or courses offline after changing $change", async ({ from, to }) => {
    const user = userEvent.setup();
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation(async (input) => {
      const path = String(input);

      if (path.startsWith("/api/students?")) {
        return Response.json({ items: [student], page: 0, totalPages: 1 });
      }

      if (path.startsWith("/api/course-enrollment-options?")) {
        return Response.json({ items: [course], page: 0, totalPages: 1 });
      }

      throw new Error(`Unexpected catalog request: ${path}`);
    });
    const { rerender, unmount, queryClient } = renderWithQueryClient(fields(from));
    const wasOnline = onlineManager.isOnline();

    try {
      await user.click(screen.getByRole("combobox", { name: "Estudiante" }));
      expect(await screen.findByRole("option", { name: "Privada, Ana · 99000001" })).toBeVisible();
      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("combobox", { name: "Curso" }));
      expect(await screen.findByRole("option", { name: /Curso privado A/ })).toBeVisible();
      await user.keyboard("{Escape}");
      expect(fetchMock).toHaveBeenCalledTimes(2);

      act(() => onlineManager.setOnline(false));
      rerender(fields(to));

      for (const name of ["Estudiante", "Curso"]) {
        await user.click(screen.getByRole("combobox", { name }));
        expect(screen.queryByRole("option", { name: "Privada, Ana · 99000001" })).not.toBeInTheDocument();
        expect(screen.queryByRole("option", { name: /Curso privado A/ })).not.toBeInTheDocument();
        await user.keyboard("{Escape}");
      }

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(
        queryClient
          .getQueryCache()
          .getAll()
          .filter((query) => query.state.data !== undefined),
      ).toHaveLength(2);
    } finally {
      unmount();
      queryClient.clear();
      act(() => onlineManager.setOnline(wasOnline));
    }
  });
});
