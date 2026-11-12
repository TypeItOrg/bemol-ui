import {
  CONFIGURED_ANSWERS,
  CONFIGURED_APPLICATION,
  configuredForm,
  FORM_QUESTIONS,
} from "@features/enrollment-applications/test-utils/enrollment-form-fixtures";
import { createSchoolingFormState } from "@features/enrollment-applications/utils/enrollment-schooling-form.util";
import { buildEnrollmentWizardData } from "@features/enrollment-applications/utils/enrollment-wizard-data.util";

const input = {
  initial: CONFIGURED_APPLICATION.data,
  schooling: createSchoolingFormState(undefined),
  healthInclusion: { receivesReasonableAdjustments: false },
  responsible: { fullName: "", documentNumber: "", phoneNumber: "", email: "", occupation: "", educationLevel: "" },
  preference: { preferredShift: "MORNING", allowsImageUse: false, isReenrolling: false, previousTeacher: "Otro" },
  selectedCourseIds: CONFIGURED_APPLICATION.data.courses!.map((course) => course.courseId),
  customAnswers: CONFIGURED_ANSWERS,
};

describe("buildEnrollmentWizardData", () => {
  it("removes disabled blocks from the serialized payload, including default false values", () => {
    const payload = JSON.parse(JSON.stringify(buildEnrollmentWizardData({ ...input, definition: configuredForm() })));
    expect(payload).not.toHaveProperty("academicBackground");
    expect(payload).not.toHaveProperty("healthInclusion");
    expect(payload).not.toHaveProperty("preference");
    expect(payload.customAnswers).toEqual(CONFIGURED_ANSWERS);
    expect(payload.courses).toEqual(CONFIGURED_APPLICATION.data.courses!.map((course) => ({ ...course, preferredTeacherId: null })));
  });

  it("sends only the standalone shift and retains false/zero custom answers", () => {
    const payload = buildEnrollmentWizardData({ ...input, definition: configuredForm(FORM_QUESTIONS, ["PREFERRED_SHIFT"]) });
    expect(payload.preference).toEqual({ preferredShift: "MORNING" });
    expect(payload.customAnswers).toEqual(CONFIGURED_ANSWERS);
  });

  it("keeps BASE native data and never sends new custom defaults", () => {
    const payload = buildEnrollmentWizardData(input);
    expect(payload.academicBackground).toBeDefined();
    expect(payload.healthInclusion).toEqual(input.healthInclusion);
    expect(payload.preference).toEqual(input.preference);
    expect(payload.customAnswers).toBeUndefined();
  });

  it("sends an empty answer snapshot when all answers are removed", () => {
    expect(buildEnrollmentWizardData({ ...input, definition: configuredForm(), customAnswers: {} }).customAnswers).toEqual({});
  });
});
