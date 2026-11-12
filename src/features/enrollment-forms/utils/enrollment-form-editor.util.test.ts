import { formDefinitionFixture, formTestId } from "@features/enrollment-forms/testing/enrollment-form.fixture";
import {
  enrollmentBlockLocked,
  explicitEnrollmentPdf,
  moveEnrollmentItem,
  reconcileEnrollmentPdf,
} from "@features/enrollment-forms/utils/enrollment-form-editor.util";

it("moves stable identities without mutating the source", () => {
  const original = ["first", "second", "third"];
  expect(moveEnrollmentItem(original, 1, -1)).toEqual(["second", "first", "third"]);
  expect(original).toEqual(["first", "second", "third"]);
  expect(moveEnrollmentItem(original, 0, -1)).toBe(original);
});

it("locks only required native blocks", () => {
  expect(enrollmentBlockLocked("PERSONAL_DATA")).toBe(true);
  expect(enrollmentBlockLocked("RESPONSIBLE")).toBe(true);
  expect(enrollmentBlockLocked("SCHOOLING")).toBe(false);
  expect(enrollmentBlockLocked("PREFERENCES")).toBe(false);
  expect(enrollmentBlockLocked(null)).toBe(false);
});

it("materializes core PDF references even when an explicit layout omits them", () => {
  const definition = formDefinitionFixture();
  definition.pdfSections = [{ sectionId: formTestId(5), questionIds: [formTestId(6)] }];
  expect(explicitEnrollmentPdf(definition).map((item) => item.sectionId)).toEqual([formTestId(1), formTestId(2), formTestId(3), formTestId(5)]);
  expect(explicitEnrollmentPdf(definition).filter((item) => item.sectionId !== formTestId(5))).toHaveLength(3);
});

it("removes stale PDF references instead of reinterpreting an empty list as all questions", () => {
  const definition = formDefinitionFixture();
  definition.pdfSections = [
    { sectionId: formTestId(1), questionIds: [] },
    { sectionId: formTestId(5), questionIds: [formTestId(6)] },
  ];
  definition.sections[4].questions = [];
  expect(reconcileEnrollmentPdf(definition).pdfSections.map((item) => item.sectionId)).toEqual([formTestId(2), formTestId(3), formTestId(1)]);
  definition.sections = definition.sections.filter((item) => item.id !== formTestId(5));
  expect(reconcileEnrollmentPdf(definition).pdfSections.map((item) => item.sectionId)).toEqual([formTestId(2), formTestId(3), formTestId(1)]);
});

it("does not restore all optional PDF fields when deleting the only explicitly selected section", () => {
  const definition = formDefinitionFixture();
  definition.pdfSections = [{ sectionId: formTestId(5), questionIds: [formTestId(6)] }];
  definition.sections = definition.sections.filter((item) => item.id !== formTestId(5));
  expect(reconcileEnrollmentPdf(definition).pdfSections.map((item) => item.sectionId)).toEqual([formTestId(1), formTestId(2), formTestId(3)]);
});
