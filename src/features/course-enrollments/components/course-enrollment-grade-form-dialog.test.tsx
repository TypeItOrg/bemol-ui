import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { updateInstitutionalGradeAction } from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { CourseEnrollmentGradeFormDialog } from "@features/course-enrollments/components/course-enrollment-grade-form-dialog";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";

jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}));

jest.mock("@features/course-enrollments/actions/course-enrollment-grade.actions", () => ({
  createInstitutionalGradeAction: jest.fn(),
  createTeacherGradeAction: jest.fn(),
  updateInstitutionalGradeAction: jest.fn(),
  updateTeacherGradeAction: jest.fn(),
}));

const ENROLLMENT_ID = "00000000-0000-4000-8000-000000000002";

const publishedGrade = {
  id: "00000000-0000-4000-8000-000000000003",
  evaluation: "Parcial 1",
  value: 7,
  publicationStatus: "PUBLISHED",
  version: 3,
} as CourseEnrollmentGrade;

function renderDialog(): { onOpenChange: jest.Mock; onSaved: jest.Mock } {
  const onOpenChange = jest.fn();
  const onSaved = jest.fn();

  render(
    <CourseEnrollmentGradeFormDialog
      mode="institutional"
      enrollmentId={ENROLLMENT_ID}
      grade={publishedGrade}
      open
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />,
  );

  return { onOpenChange, onSaved };
}

describe("CourseEnrollmentGradeFormDialog", () => {
  it("uses a neutral message and closes when the update had no changes", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ unchanged: true });

    const { onOpenChange, onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    expect(updateInstitutionalGradeAction).toHaveBeenCalledWith(ENROLLMENT_ID, publishedGrade.id, publishedGrade.version, expect.any(FormData));
    expect(toast).toHaveBeenCalledWith("No hubo cambios; la nota quedó igual.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("still congratulates a real update", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ pending: true });

    const { onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    expect(toast.success).toHaveBeenCalledWith(COURSE_ENROLLMENT_GRADE_MESSAGES.CHANGES_SAVED);
    expect(toast).not.toHaveBeenCalled();
  });

  it("asks the user to verify when the backend outcome is unconfirmed", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ unconfirmed: true });

    const { onOpenChange, onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    expect(toast).toHaveBeenCalledWith(COURSE_ENROLLMENT_GRADE_MESSAGES.UNCONFIRMED);
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the dialog state when the action fails", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ error: "Sin permiso" });

    const { onOpenChange, onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso");
    expect(onSaved).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
