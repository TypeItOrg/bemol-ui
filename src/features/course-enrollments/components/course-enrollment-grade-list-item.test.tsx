import { render, screen } from "@testing-library/react";

import { CourseEnrollmentGradeListItem } from "@features/course-enrollments/components/course-enrollment-grade-list-item";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";

function makeGrade(overrides: Partial<CourseEnrollmentGrade> = {}): CourseEnrollmentGrade {
  return {
    id: "g-1",
    evaluation: "Parcial 1",
    value: 7,
    publicationStatus: "PUBLISHED",
    version: 3,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
    ...overrides,
  };
}

function renderItem(grade: CourseEnrollmentGrade): void {
  render(
    <ul>
      <CourseEnrollmentGradeListItem
        grade={grade}
        canUpdate
        canDelete
        canEdit
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCancelDeletion={jest.fn()}
        onViewHistory={jest.fn()}
      />
    </ul>,
  );
}

describe("CourseEnrollmentGradeListItem", () => {
  it("shows no pending pill for a published grade without working changes", () => {
    renderItem(makeGrade());

    expect(screen.queryByText("Cambios sin publicar")).not.toBeInTheDocument();
    expect(screen.queryByText("Borrador")).not.toBeInTheDocument();
  });

  it("keeps the pending pill while unpublished differences remain", () => {
    renderItem(makeGrade({ publicationStatus: "PENDING_CHANGES" }));

    expect(screen.getByText("Cambios sin publicar")).toBeInTheDocument();
  });

  it("keeps the deletion pill and offers to undo it", () => {
    renderItem(makeGrade({ publicationStatus: "PENDING_DELETION" }));

    expect(screen.getByText("Pendiente de eliminación")).toBeInTheDocument();
  });
});
