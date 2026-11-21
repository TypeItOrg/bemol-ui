import { useParams } from "next/navigation";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StudentGradeDialog } from "@features/course-enrollments/components/student-grade-dialog";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({})),
}));

const enrollment = {
  id: "00000000-0000-4000-8000-000000000001",
  academicSpaceName: "Lenguaje",
  courseClassLabel: "Clase 1",
  status: "ENROLLED",
} as CourseEnrollment;

function renderDialog(target: CourseEnrollment = enrollment): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StudentGradeDialog enrollment={target} open onOpenChange={() => undefined} />
    </QueryClientProvider>,
  );
}

describe("StudentGradeDialog", () => {
  beforeEach(() => {
    jest.mocked(useParams).mockReturnValue({});
  });

  it("shows only published evaluation and value", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "grade-1", evaluation: "Parcial 1", value: 8 }],
    } as Response);

    renderDialog();

    await waitFor(() => expect(screen.getByText("Parcial 1")).toBeInTheDocument());
    expect(screen.queryByText(/Cargada por/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Borrador/i)).not.toBeInTheDocument();
  });

  it("uses the self-service endpoint when operating inside a selected person context", async () => {
    const personId = "00000000-0000-4000-8000-000000000099";
    jest.mocked(useParams).mockReturnValue({ personId });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "grade-1", evaluation: "Parcial 1", value: 9.5 }],
    } as Response);

    renderDialog();

    await waitFor(() => expect(screen.getByText("Parcial 1")).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/institutional/self-service/${personId}/courses/${enrollment.id}/grades`,
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("shows empty state without mentioning drafts", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response);

    renderDialog();

    await waitFor(() => expect(screen.getByText(/Todavía no hay notas publicadas/)).toBeInTheDocument());
    expect(screen.queryByText(/borrador/i)).not.toBeInTheDocument();
  });

  it("uses closed-course empty copy for completed enrollments", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response);

    renderDialog({ ...enrollment, status: "COMPLETED" });

    await waitFor(() => expect(screen.getByText(/No se publicaron notas para esta cursada/)).toBeInTheDocument());
  });

  it("allows retrying after a load failure", async () => {
    const user = userEvent.setup();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "grade-1", evaluation: "Parcial 2", value: 7 }],
      } as Response);

    renderDialog();

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar las notas.");

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Parcial 2")).toBeInTheDocument();
  });
});
