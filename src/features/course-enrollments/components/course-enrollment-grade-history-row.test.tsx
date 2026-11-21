import { render, screen, within } from "@testing-library/react";

import { CourseEnrollmentGradeHistoryRow } from "@features/course-enrollments/components/course-enrollment-grade-history-row";
import type { CourseEnrollmentGradeHistoryEvent } from "@features/course-enrollments/types/course-enrollment-grade-history-event.types";

function makeEvent(overrides: Partial<CourseEnrollmentGradeHistoryEvent> = {}): CourseEnrollmentGradeHistoryEvent {
  return {
    historyId: "h-1",
    gradeId: "g-1",
    operation: "UPDATED",
    evaluationBefore: "Parcial 1",
    valueBefore: 7,
    evaluationAfter: "Parcial 2",
    valueAfter: 8,
    publishedEvaluationBefore: null,
    publishedValueBefore: null,
    publishedEvaluationAfter: null,
    publishedValueAfter: null,
    previousStatus: "DRAFT",
    newStatus: "DRAFT",
    actor: { id: "p-1", fullName: "Ana Docente" },
    changedAt: "2026-10-05T10:00:00Z",
    ...overrides,
  };
}

function renderRowCells(event: CourseEnrollmentGradeHistoryEvent): HTMLElement[] {
  render(
    <table>
      <tbody>
        <CourseEnrollmentGradeHistoryRow event={event} />
      </tbody>
    </table>,
  );

  return within(screen.getByRole("row")).getAllByRole("cell");
}

describe("CourseEnrollmentGradeHistoryRow", () => {
  it("shows the restored published snapshot for changes reverted on enrollment exit", () => {
    const cells = renderRowCells(
      makeEvent({
        operation: "REVERTED_TO_PUBLISHED_ON_EXIT",
        evaluationBefore: "Parcial 2",
        valueBefore: 9,
        evaluationAfter: "Parcial 1",
        valueAfter: 7,
        publishedEvaluationBefore: "Parcial 1",
        publishedValueBefore: 7,
        publishedEvaluationAfter: "Parcial 1",
        publishedValueAfter: 7,
        previousStatus: "PENDING_CHANGES",
        newStatus: "PUBLISHED",
        actor: { id: "p-2", fullName: "Bruno Director" },
      }),
    );

    expect(cells[1]).toHaveTextContent("Cambios sin publicar descartados");
    expect(cells[2]).toHaveTextContent("Parcial 1");
    expect(cells[2]).toHaveTextContent("7");
    expect(cells[2]).not.toHaveTextContent("Parcial 2");
    expect(cells[2]).not.toHaveTextContent("9");
    expect(cells[3]).toHaveTextContent("Bruno Director");
  });

  it("labels a discarded draft without resulting values and attributes it to the system", () => {
    const cells = renderRowCells(
      makeEvent({
        operation: "DISCARDED_DRAFT_ON_EXIT",
        evaluationBefore: "Parcial 3",
        valueBefore: 4,
        evaluationAfter: null,
        valueAfter: null,
        previousStatus: "DRAFT",
        newStatus: null,
        actor: null,
      }),
    );

    expect(cells[1]).toHaveTextContent("Borrador descartado al finalizar la cursada");
    expect(cells[2]).toHaveTextContent("—");
    expect(cells[2]).not.toHaveTextContent("Parcial 3");
    expect(cells[3]).toHaveTextContent("Sistema");
  });
});
