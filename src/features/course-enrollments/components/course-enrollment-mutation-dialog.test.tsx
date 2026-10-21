import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { updateCourseAcademicStatusAction, withdrawCourseEnrollmentAction } from "@features/course-enrollments/actions/course-enrollment.actions";
import { CourseEnrollmentMutationDialog } from "@features/course-enrollments/components/course-enrollment-mutation-dialog";
import type { CourseEnrollment } from "@features/course-enrollments/types/course-enrollment.types";
import { GRADES_CHANGED_EVENT } from "@features/course-enrollments/utils/course-enrollment-grade-events.util";

jest.mock("@features/course-enrollments/actions/course-enrollment.actions", () => ({
  updateCourseAcademicStatusAction: jest.fn(),
  withdrawCourseEnrollmentAction: jest.fn(),
}));

const enrollment = {
  id: "00000000-0000-4000-8000-000000000002",
  studentName: "Ana García",
  academicSpaceName: "Lenguaje",
  academicStatus: "PASSED",
  version: 3,
} as CourseEnrollment;

function renderDialog(mode: "withdraw" | "academic"): { onOpenChange: jest.Mock; onUpdated: jest.Mock } {
  const onOpenChange = jest.fn();
  const onUpdated = jest.fn();

  render(<CourseEnrollmentMutationDialog enrollment={enrollment} mode={mode} open onOpenChange={onOpenChange} onUpdated={onUpdated} />);

  return { onOpenChange, onUpdated };
}

function submitButtonName(mode: "withdraw" | "academic"): string {
  return mode === "withdraw" ? "Registrar baja" : "Registrar resultado";
}

describe("CourseEnrollmentMutationDialog", () => {
  it.each(["withdraw", "academic"] as const)("notifies the grade views after a successful %s action", async (mode) => {
    const user = userEvent.setup();
    jest.mocked(withdrawCourseEnrollmentAction).mockResolvedValue({});
    jest.mocked(updateCourseAcademicStatusAction).mockResolvedValue({});

    const gradesChanged = jest.fn();
    window.addEventListener(GRADES_CHANGED_EVENT, gradesChanged);

    const { onOpenChange, onUpdated } = renderDialog(mode);

    await user.type(screen.getByRole("textbox", { name: /Motivo/ }), "Baja solicitada");
    await user.click(screen.getByRole("button", { name: submitButtonName(mode) }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledTimes(1));

    expect(gradesChanged).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);

    window.removeEventListener(GRADES_CHANGED_EVENT, gradesChanged);
  });

  it("keeps the dialog open and silent when the action fails", async () => {
    const user = userEvent.setup();
    jest.mocked(withdrawCourseEnrollmentAction).mockResolvedValue({ error: "Sin permiso" });

    const gradesChanged = jest.fn();
    window.addEventListener(GRADES_CHANGED_EVENT, gradesChanged);

    const { onOpenChange, onUpdated } = renderDialog("withdraw");

    await user.type(screen.getByRole("textbox", { name: /Motivo/ }), "Baja solicitada");
    await user.click(screen.getByRole("button", { name: submitButtonName("withdraw") }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso");
    expect(gradesChanged).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();

    window.removeEventListener(GRADES_CHANGED_EVENT, gradesChanged);
  });
});
