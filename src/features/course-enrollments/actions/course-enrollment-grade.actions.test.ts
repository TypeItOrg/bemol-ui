import { revalidatePath } from "next/cache";

import { createInstitutionalGradeAction, updateInstitutionalGradeAction } from "@features/course-enrollments/actions/course-enrollment-grade.actions";
import { institutionalApiFetch } from "@features/institutional-auth/services/institutional-api-fetch.service";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@features/institutional-auth/services/institutional-api-fetch.service", () => ({
  institutionalApiFetch: jest.fn(),
}));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn().mockResolvedValue({ institutionId: "00000000-0000-4000-8000-000000000001" }),
}));

const ENROLLMENT_ID = "00000000-0000-4000-8000-000000000002";
const GRADE_ID = "00000000-0000-4000-8000-000000000003";

function gradeForm(evaluation = "Parcial 1", value = "7"): FormData {
  const data = new FormData();
  data.set("evaluation", evaluation);
  data.set("value", value);

  return data;
}

function gradeResponse(version: number): Response {
  return new Response(JSON.stringify({ id: GRADE_ID, evaluation: "Parcial 1", value: 7, publicationStatus: "PUBLISHED", version }), { status: 200 });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("course enrollment grade actions", () => {
  it("reports an update that kept the expected version as unchanged", async () => {
    jest.mocked(institutionalApiFetch).mockResolvedValue(gradeResponse(3));

    await expect(updateInstitutionalGradeAction(ENROLLMENT_ID, GRADE_ID, 3, gradeForm("Parcial 1", "7.00"))).resolves.toEqual({
      unchanged: true,
    });

    expect(institutionalApiFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/course-enrollments/${ENROLLMENT_ID}/grades/${GRADE_ID}`),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ evaluation: "Parcial 1", value: 7, expectedVersion: 3 }),
      }),
    );
  });

  it("keeps the pending feedback when the backend increased the version", async () => {
    jest.mocked(institutionalApiFetch).mockResolvedValue(gradeResponse(4));

    await expect(updateInstitutionalGradeAction(ENROLLMENT_ID, GRADE_ID, 3, gradeForm())).resolves.toEqual({ pending: true });
  });

  it("does not affirm a change when the update body cannot be read", async () => {
    jest.mocked(institutionalApiFetch).mockResolvedValue(new Response("not-json", { status: 200 }));

    await expect(updateInstitutionalGradeAction(ENROLLMENT_ID, GRADE_ID, 3, gradeForm())).resolves.toEqual({ unconfirmed: true });
  });

  it("propagates the API error without revalidating", async () => {
    jest.mocked(institutionalApiFetch).mockResolvedValue(new Response(JSON.stringify({ message: "Sin permiso" }), { status: 403 }));

    await expect(updateInstitutionalGradeAction(ENROLLMENT_ID, GRADE_ID, 3, gradeForm())).resolves.toEqual({ error: "Sin permiso" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("still reports created grades as drafts", async () => {
    jest.mocked(institutionalApiFetch).mockResolvedValue(new Response(null, { status: 201 }));

    await expect(createInstitutionalGradeAction(ENROLLMENT_ID, gradeForm())).resolves.toEqual({ draft: true });
    expect(institutionalApiFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/course-enrollments/${ENROLLMENT_ID}/grades`),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ evaluation: "Parcial 1", value: 7 }) }),
    );
  });
});
