import { submitEnrollmentApplicationAction } from "@features/enrollment-applications/actions/enrollment-application.actions";
import { CONFIGURED_APPLICATION, formTestId } from "@features/enrollment-applications/test-utils/enrollment-form-fixtures";
import { submitEnrollmentWizard } from "@features/enrollment-applications/utils/submit-enrollment-wizard.util";
import { EnrollmentMutationError } from "@features/enrollment-applications/utils/unwrap-enrollment-result.util";

jest.mock("@features/enrollment-applications/actions/enrollment-application.actions", () => ({ submitEnrollmentApplicationAction: jest.fn() }));
const submit = jest.mocked(submitEnrollmentApplicationAction);

function input(): Parameters<typeof submitEnrollmentWizard>[0] {
  return {
    blockedDocumentsRef: { current: new Set() },
    application: CONFIGURED_APPLICATION,
    isCancelDialogOpen: false,
    setValidationIssues: jest.fn(),
    setInvalidInstrumentGroups: jest.fn(),
    pendingInstrumentGroups: [],
    structuredData: CONFIGURED_APPLICATION.data,
    selectedTrainingPathId: CONFIGURED_APPLICATION.data.careerSelection!.trainingPathId!,
    courseOptions: [],
    selectedCourseIds: [formTestId(510)],
    handleActiveTabChange: jest.fn(),
    isMinor: false,
    setPendingFocusFieldId: jest.fn(),
    draftSaveQueue: { current: Promise.resolve() },
    persistDraft: jest.fn().mockResolvedValue({ ...CONFIGURED_APPLICATION, draftRevision: 9 }),
    definition: CONFIGURED_APPLICATION.formDefinition,
    setApplication: jest.fn(),
    onConflict: jest.fn(),
    router: { bfcacheId: "test", refresh: jest.fn(), back: jest.fn(), forward: jest.fn(), push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() },
  };
}

describe("submitEnrollmentWizard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    submit.mockResolvedValue({ application: { ...CONFIGURED_APPLICATION, status: "SUBMITTED", draftRevision: 9 } });
  });

  it("drains pending autosave, saves the current full snapshot, then submits its returned revision", async () => {
    const params = input();
    let resolveSave!: () => void;
    params.draftSaveQueue.current = new Promise((resolve) => {
      resolveSave = resolve;
    });
    const pending = submitEnrollmentWizard(params);
    await Promise.resolve();
    expect(params.persistDraft).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    resolveSave();
    await expect(pending).resolves.toEqual({});
    expect(params.persistDraft).toHaveBeenCalledWith(CONFIGURED_APPLICATION.data);
    expect(submit).toHaveBeenCalledWith(CONFIGURED_APPLICATION.applicationId, CONFIGURED_APPLICATION.personId, 9);
    expect(params.router.refresh).toHaveBeenCalled();
  });

  it("routes an unanswered required custom boolean to its pinned section and control", async () => {
    const params = input();
    params.structuredData = { ...params.structuredData, customAnswers: { ...params.structuredData.customAnswers, [formTestId(105)]: null } };
    const result = await submitEnrollmentWizard(params);
    expect(result.issues).toEqual([expect.objectContaining({ path: ["customAnswers", formTestId(105)] })]);
    expect(params.handleActiveTabChange).toHaveBeenCalledWith(`custom-${formTestId(50)}`);
    expect(params.setPendingFocusFieldId).toHaveBeenCalledWith(`enrollment-answer-${formTestId(105)}`);
    expect(params.persistDraft).not.toHaveBeenCalled();
  });

  it("keeps document gates after flushing the current snapshot", async () => {
    const params = input();
    params.persistDraft = jest.fn().mockResolvedValue({
      ...CONFIGURED_APPLICATION,
      draftRevision: 9,
      documents: [{ id: "doc", name: "DNI", level: "AT_SUBMISSION", currentAttachment: null }],
    });
    const result = await submitEnrollmentWizard(params);
    expect(result.issues).toEqual([expect.objectContaining({ path: ["documents", "doc"] })]);
    expect(params.handleActiveTabChange).toHaveBeenCalledWith("documents");
    expect(submit).not.toHaveBeenCalled();
  });

  it("preserves the error and stops submission if a pending save found a stale revision", async () => {
    const params = input();
    params.persistDraft = jest.fn().mockRejectedValue(new EnrollmentMutationError("Recargá la inscripción.", 409));
    expect(await submitEnrollmentWizard(params)).toEqual({ error: "Recargá la inscripción." });
    expect(submit).not.toHaveBeenCalled();
    expect(params.setApplication).not.toHaveBeenCalled();
    expect(params.onConflict).toHaveBeenCalled();
  });

  it("also pauses autosave when submit itself reports a conflict after saving", async () => {
    const params = input();
    submit.mockResolvedValue({ error: "Otra sesión modificó la inscripción", status: 409 });
    expect(await submitEnrollmentWizard(params)).toEqual({ error: "Otra sesión modificó la inscripción" });
    expect(params.onConflict).toHaveBeenCalledTimes(1);
  });

  it("maps server custom field errors to the same section and focus as client validation", async () => {
    const params = input();
    submit.mockResolvedValue({
      error: "Respuesta inválida",
      status: 400,
      fieldErrors: { [`customAnswers.${formTestId(106)}`]: "La opción no existe" },
    });
    expect(await submitEnrollmentWizard(params)).toMatchObject({
      error: "Respuesta inválida",
      issues: [expect.objectContaining({ path: ["customAnswers", formTestId(106)] })],
    });
    expect(params.handleActiveTabChange).toHaveBeenCalledWith(`custom-${formTestId(50)}`);
    expect(params.setPendingFocusFieldId).toHaveBeenCalledWith(`enrollment-answer-${formTestId(106)}`);
  });

  it("does not navigate to an absent native tab when the server rejects stale disabled data", async () => {
    const params = input();
    submit.mockResolvedValue({
      error: "Bloque desactivado",
      status: 400,
      fieldErrors: { "academicBackground.schoolOrigin": "El bloque no está habilitado" },
    });
    await submitEnrollmentWizard(params);
    expect(params.handleActiveTabChange).not.toHaveBeenCalled();
    expect(params.setPendingFocusFieldId).toHaveBeenCalledWith("enrollment-validation-alert");
  });
});
