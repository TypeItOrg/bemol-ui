import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTableNavigationProvider } from "@common/components/ui/data-table-navigation";
import { TooltipProvider } from "@common/components/ui/tooltip";

import { CourseWaitlistTable } from "@features/course-enrollments/components/course-waitlist-table";
import type { CourseWaitlistEntry } from "@features/course-enrollments/types/course-waitlist-entry.types";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/courses/course-1/waitlist",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@features/enrollment-applications/components/enrollment-application-courses-management", () => ({
  EnrollmentApplicationCourseDialog: ({ applicationId }: { applicationId: string }) => <div role="dialog">Solicitud {applicationId}</div>,
}));

const ENTRY: CourseWaitlistEntry = {
  trainingPathId: "training-path-id",
  applicationId: "parent-1",
  applicationCourseId: "child-1",
  courseId: "course-1",
  hasCapacity: true,
  waitlistNumber: 1,
  applicantName: "Ana Pérez",
  applicantDocumentNumber: "12345678",
  requestedAt: "2026-09-01T12:00:00Z",
  waitlistedAt: "2026-09-02T12:00:00Z",
  originalReason: "NO_CAPACITY_AT_PARENT_APPROVAL",
  currentSituation: "WAITLISTED",
  preferredShift: null,
  preferredTeacherId: null,
  applicationCourse: {
    applicationCourseId: "child-1",
    courseId: "course-1",
    studyPlanSpaceId: "space-1",
    academicSpaceName: "Teoría",
    academicLevelName: null,
    studyPlanName: "Plan",
    trainingPathName: "Trayecto",
    instrumentId: null,
    instrumentName: null,
    preferredTeacherId: null,
    status: "WAITLISTED",
    requestedAt: "2026-09-01T12:00:00Z",
    submittedWithCapacity: false,
    waitlistNumber: 1,
    waitlistedAt: "2026-09-02T12:00:00Z",
    waitlistReason: "NO_CAPACITY_AT_PARENT_APPROVAL",
    resolvedAt: null,
    resolvedByPersonId: null,
    resolutionReasonCode: null,
    resolutionReasonText: null,
    version: 1,
  },
};

describe("CourseWaitlistTable", () => {
  it("keeps a free seat until an authorized user explicitly opens the acceptance flow", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <DataTableNavigationProvider>
          <CourseWaitlistTable entries={[ENTRY]} canEnroll />
        </DataTableNavigationProvider>
      </TooltipProvider>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir acciones de Ana Pérez" }));
    await user.click(screen.getByRole("menuitem", { name: "Incorporar" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("parent-1");
  });

  it("blocks incorporation without capacity", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <DataTableNavigationProvider>
          <CourseWaitlistTable entries={[{ ...ENTRY, hasCapacity: false }]} canEnroll />
        </DataTableNavigationProvider>
      </TooltipProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Abrir acciones de Ana Pérez" }));
    expect(screen.getByRole("menuitem", { name: "Incorporar" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("menuitem", { name: "Incorporar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not offer incorporation without permission", () => {
    render(
      <TooltipProvider>
        <DataTableNavigationProvider>
          <CourseWaitlistTable entries={[ENTRY]} />
        </DataTableNavigationProvider>
      </TooltipProvider>,
    );
    expect(screen.queryByRole("button", { name: /Abrir acciones/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Incorporar" })).not.toBeInTheDocument();
  });
});
