import {
  createEnrollmentSubmissionSchema,
  updateEnrollmentDraftSchema,
} from "@features/enrollment-applications/schemas/enrollment-application.schema";
import { enrollmentAnswerIssues } from "@features/enrollment-applications/schemas/enrollment-custom-answers.schema";
import {
  CONFIGURED_ANSWERS,
  CONFIGURED_APPLICATION,
  configuredForm,
  FORM_QUESTIONS,
  formTestId,
} from "@features/enrollment-applications/test-utils/enrollment-form-fixtures";

describe("configured enrollment validation", () => {
  it("validates every custom type and treats false and zero as answered", () => {
    expect(enrollmentAnswerIssues(configuredForm(), CONFIGURED_ANSWERS, true)).toEqual([]);
    expect(createEnrollmentSubmissionSchema(false, configuredForm()).safeParse(CONFIGURED_APPLICATION.data).success).toBe(true);
  });

  it("allows incomplete drafts but requires custom answers on submission", () => {
    expect(enrollmentAnswerIssues(configuredForm(), {}, false)).toEqual([]);
    expect(enrollmentAnswerIssues(configuredForm(), {}, true).map((issue) => issue.path[1])).toEqual(
      FORM_QUESTIONS.filter((question) => question.required).map((question) => question.id),
    );
    expect(enrollmentAnswerIssues(configuredForm(), { [formTestId(105)]: null }, true)).toContainEqual(
      expect.objectContaining({ path: ["customAnswers", formTestId(105)] }),
    );
  });

  it.each([
    [101, 17],
    [101, "a".repeat(501)],
    [102, "\u0000"],
    [102, "\ud800"],
    [103, "0"],
    [103, "0x10"],
    [103, Infinity],
    [104, "2026-02-30"],
    [104, "15/01/2026"],
    [105, "false"],
    [106, "Presencial"],
    [106, formTestId(999)],
    [107, [formTestId(204), formTestId(204)]],
    [107, ["Martes"]],
    [107, formTestId(204)],
  ])("rejects malformed answer %s=%s before coercion", (id, value) => {
    expect(enrollmentAnswerIssues(configuredForm(), { [formTestId(id as number)]: value }, false)).toEqual([
      expect.objectContaining({ path: ["customAnswers", formTestId(id as number)] }),
    ]);
  });

  it("rejects unknown questions and custom answers for BASE", () => {
    expect(enrollmentAnswerIssues(configuredForm(), { [formTestId(999)]: "extra" }, false)).toHaveLength(1);
    expect(enrollmentAnswerIssues(undefined, { [formTestId(101)]: "extra" }, false)).toHaveLength(1);
  });

  it("preserves custom answers and revision through draft action parsing without accepting coercions", () => {
    expect(updateEnrollmentDraftSchema.parse({ data: CONFIGURED_APPLICATION.data, expectedRevision: 4 })).toMatchObject({
      expectedRevision: 4,
      data: { customAnswers: CONFIGURED_ANSWERS },
    });
    expect(updateEnrollmentDraftSchema.safeParse({ data: {}, expectedRevision: "4" }).success).toBe(false);
    expect(updateEnrollmentDraftSchema.safeParse({ data: { customAnswers: { wrong: false } } }).success).toBe(false);
    expect(updateEnrollmentDraftSchema.safeParse({ data: { customAnswers: { [formTestId(101)]: { nested: true } } } }).success).toBe(false);
  });

  it("omits disabled native validation but rejects unexpected disabled block data", () => {
    const schema = createEnrollmentSubmissionSchema(false, configuredForm());
    expect(schema.safeParse(CONFIGURED_APPLICATION.data).success).toBe(true);

    for (const block of ["academicBackground", "healthInclusion", "preference"]) {
      const parsed = schema.safeParse({ ...CONFIGURED_APPLICATION.data, [block]: {} });
      expect(parsed.success).toBe(false);

      if (!parsed.success) {
        expect(parsed.error.issues[0].path).toEqual([block]);
      }
    }
  });

  it("requires only preferredShift when that standalone block is enabled", () => {
    const schema = createEnrollmentSubmissionSchema(false, configuredForm(FORM_QUESTIONS, ["PREFERRED_SHIFT"]));
    expect(schema.safeParse({ ...CONFIGURED_APPLICATION.data, preference: { preferredShift: "MORNING" } }).success).toBe(true);
    expect(schema.safeParse(CONFIGURED_APPLICATION.data).success).toBe(false);
  });

  it("retains core personal and representative rules", () => {
    const schema = createEnrollmentSubmissionSchema(true, configuredForm());
    const missing = schema.safeParse(CONFIGURED_APPLICATION.data);
    expect(missing.success).toBe(false);

    if (!missing.success) {
      expect(missing.error.issues.map((issue) => issue.path.join("."))).toEqual([
        "responsible.fullName",
        "responsible.documentNumber",
        "responsible.phoneNumber",
      ]);
    }

    expect(
      schema.safeParse({ ...CONFIGURED_APPLICATION.data, responsible: { fullName: "Tutor", documentNumber: "30111222", phoneNumber: "3534112233" } })
        .success,
    ).toBe(true);
    expect(createEnrollmentSubmissionSchema(false, configuredForm()).safeParse({ ...CONFIGURED_APPLICATION.data, courses: [] }).success).toBe(false);
  });
});
