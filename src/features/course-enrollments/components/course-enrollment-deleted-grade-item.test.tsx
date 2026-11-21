import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CourseEnrollmentDeletedGradeItem } from "@features/course-enrollments/components/course-enrollment-deleted-grade-item";
import type { CourseEnrollmentArchivedGrade } from "@features/course-enrollments/types/course-enrollment-archived-grade.types";

function makeGrade(overrides: Partial<CourseEnrollmentArchivedGrade> = {}): CourseEnrollmentArchivedGrade {
  return {
    gradeId: "g-1",
    lastEvaluation: "Parcial 1",
    lastValue: 8,
    deletedAt: "2026-10-05T10:00:00Z",
    deletionType: "DELETED_PUBLISHED",
    ...overrides,
  };
}

describe("CourseEnrollmentDeletedGradeItem", () => {
  it("keeps the Eliminada badge for grades deleted by a person", () => {
    render(
      <ul>
        <CourseEnrollmentDeletedGradeItem grade={makeGrade()} onViewHistory={jest.fn()} />
      </ul>,
    );

    expect(screen.getByText("Eliminada")).toBeInTheDocument();
    expect(screen.queryByText("Borrador descartado")).not.toBeInTheDocument();
  });

  it("labels drafts discarded when the enrollment exited and keeps the history entry available", async () => {
    const user = userEvent.setup();
    const onViewHistory = jest.fn();

    render(
      <ul>
        <CourseEnrollmentDeletedGradeItem grade={makeGrade({ deletionType: "DISCARDED_DRAFT_ON_EXIT" })} onViewHistory={onViewHistory} />
      </ul>,
    );

    expect(screen.getByText("Borrador descartado")).toBeInTheDocument();
    expect(screen.queryByText("Eliminada")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver historial de Parcial 1" }));

    expect(onViewHistory).toHaveBeenCalledWith("g-1", "Parcial 1");
  });
});
