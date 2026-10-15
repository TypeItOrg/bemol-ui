import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CourseEnrollmentGradeHistoryDialog } from "@features/course-enrollments/components/course-enrollment-grade-history-dialog";

const events = [
  {
    historyId: "h-1",
    gradeId: "g-1",
    operation: "CREATED",
    evaluationBefore: null,
    valueBefore: null,
    evaluationAfter: "Parcial 1",
    valueAfter: 7,
    publishedEvaluationBefore: null,
    publishedValueBefore: null,
    publishedEvaluationAfter: null,
    publishedValueAfter: null,
    previousStatus: null,
    newStatus: "DRAFT",
    actor: { id: "p-1", fullName: "Ana Docente" },
    changedAt: "2026-10-01T10:00:00Z",
  },
  {
    historyId: "h-2",
    gradeId: "g-1",
    operation: "UPDATED",
    evaluationBefore: "Parcial 1",
    valueBefore: 7,
    evaluationAfter: "Parcial 1",
    valueAfter: 8,
    publishedEvaluationBefore: null,
    publishedValueBefore: null,
    publishedEvaluationAfter: null,
    publishedValueAfter: null,
    previousStatus: "DRAFT",
    newStatus: "DRAFT",
    actor: { id: "p-1", fullName: "Ana Docente" },
    changedAt: "2026-10-02T10:00:00Z",
  },
  {
    historyId: "h-3",
    gradeId: "g-1",
    operation: "PUBLISHED",
    evaluationBefore: null,
    valueBefore: null,
    evaluationAfter: null,
    valueAfter: null,
    publishedEvaluationBefore: null,
    publishedValueBefore: null,
    publishedEvaluationAfter: "Parcial 1",
    publishedValueAfter: 8,
    previousStatus: "DRAFT",
    newStatus: "PUBLISHED",
    actor: { id: "p-2", fullName: "Bruno Director" },
    changedAt: "2026-10-03T10:00:00Z",
  },
];

function renderDialog() {
  return render(
    <CourseEnrollmentGradeHistoryDialog
      mode="institutional"
      enrollmentId="e-1"
      gradeId="g-1"
      gradeLabel="Parcial 1"
      open
      onOpenChange={() => undefined}
    />,
  );
}

describe("CourseEnrollmentGradeHistoryDialog", () => {
  it("renders history table with operations, values and authors", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ content: events }) } as Response);

    renderDialog();

    await waitFor(() => expect(screen.getByText("Nota creada")).toBeInTheDocument());
    expect(screen.getByText("Nota editada")).toBeInTheDocument();
    expect(screen.getByText("Nota publicada")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Fecha y hora" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Operación" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Autor" })).toBeInTheDocument();
    expect(screen.getAllByText(/Ana Docente/).length).toBeGreaterThan(0);
    expect(screen.getByText("Bruno Director")).toBeInTheDocument();
  });

  it("shows empty state without events", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) } as Response);

    renderDialog();

    await waitFor(() => expect(screen.getByText("Sin historial")).toBeInTheDocument());
  });

  it("shows error and retries on failure", async () => {
    const user = userEvent.setup();

    global.fetch = jest.fn().mockRejectedValueOnce(new Error("network"));

    renderDialog();

    await waitFor(() => expect(screen.getByText(/No se pudieron cargar/)).toBeInTheDocument());

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: events }),
    } as Response);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(screen.getByText("Nota creada")).toBeInTheDocument());
  });
});
