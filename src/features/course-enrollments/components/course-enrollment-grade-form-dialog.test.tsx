import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { updateInstitutionalGradeAction } from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { CourseEnrollmentGradeFormDialog } from "@features/course-enrollments/components/course-enrollment-grade-form-dialog";
import { COURSE_ENROLLMENT_GRADE_MESSAGES } from "@features/course-enrollments/constants/course-enrollment-grade.constants";
import { GRADE_MANAGEMENT_MODE } from "@features/course-enrollments/services/course-enrollment-grade-client.service";
import { COURSE_ENROLLMENT_GRADE_STATUS } from "@features/course-enrollments/types/course-enrollment-grade-status.types";
import type { CourseEnrollmentGrade } from "@features/course-enrollments/types/course-enrollment-grade.types";

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
  publicationStatus: COURSE_ENROLLMENT_GRADE_STATUS.PUBLISHED,
  version: 3,
} as CourseEnrollmentGrade;

function renderDialog(): { onOpenChange: jest.Mock; onSaved: jest.Mock } {
  const onOpenChange = jest.fn();
  const onSaved = jest.fn();

  render(
    <CourseEnrollmentGradeFormDialog
      mode={GRADE_MANAGEMENT_MODE.INSTITUTIONAL}
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
  it("closes and refreshes when the update had no changes", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ unchanged: true });

    const { onOpenChange, onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    expect(updateInstitutionalGradeAction).toHaveBeenCalledWith(ENROLLMENT_ID, publishedGrade.id, publishedGrade.version, expect.any(FormData));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes and refreshes after saving pending changes", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ pending: true });

    const { onOpenChange, onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes and refreshes when the backend outcome is unconfirmed", async () => {
    const user = userEvent.setup();
    jest.mocked(updateInstitutionalGradeAction).mockResolvedValue({ unconfirmed: true });

    const { onOpenChange, onSaved } = renderDialog();

    await user.click(screen.getByRole("button", { name: COURSE_ENROLLMENT_GRADE_MESSAGES.SAVE_GRADE }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

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
  });
});
