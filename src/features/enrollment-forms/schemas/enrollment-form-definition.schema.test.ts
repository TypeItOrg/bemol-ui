import { enrollmentFormCommandSchema } from "@features/enrollment-forms/schemas/enrollment-form-command.schema";
import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";
import { formDefinitionFixture, formTestId } from "@features/enrollment-forms/testing/enrollment-form.fixture";

it("accepts the native base, custom boolean false and valid Unicode", () => {
  const definition = formDefinitionFixture();
  definition.sections[4].questions[0].help = "Instrumento 🎻";
  expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(true);
});

it("does not coerce missing or string required flags", () => {
  for (const required of [undefined, "false", null]) {
    const definition = formDefinitionFixture();
    expect(
      enrollmentFormDefinitionSchema.safeParse({
        ...definition,
        sections: [{ ...definition.sections[4], questions: [{ ...definition.sections[4].questions[0], required }] }],
      }).success,
    ).toBe(false);
  }
});

it("rejects repeated native blocks, duplicate IDs, invalid options and PDF references", () => {
  const definition = formDefinitionFixture();
  expect(
    enrollmentFormDefinitionSchema.safeParse({ ...definition, sections: [...definition.sections, { ...definition.sections[0], id: formTestId(90) }] })
      .success,
  ).toBe(false);
  expect(enrollmentFormDefinitionSchema.safeParse({ ...definition, pdfSections: [{ sectionId: formTestId(90), questionIds: [] }] }).success).toBe(
    false,
  );
  definition.sections[4].questions[0].type = "SINGLE_CHOICE";
  expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(false);
  definition.sections[4].questions[0].options = [{ id: formTestId(1), label: "Sí" }];
  expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(false);
  definition.sections[4].questions[0].options[0].id = formTestId(7);
  expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(true);
});

it("rejects unsafe JSONB text and server size limits", () => {
  for (const help of ["\u0000", "\uD800", "x".repeat(1001)]) {
    const definition = formDefinitionFixture();
    definition.sections[4].questions[0].help = help;
    expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(false);
  }

  expect(enrollmentFormCommandSchema.safeParse({ kind: "create", name: "x\u0000" }).success).toBe(false);
  expect(
    enrollmentFormCommandSchema.safeParse({ kind: "publish", formId: formTestId(1), versionId: formTestId(2), expectedRevision: "1" }).success,
  ).toBe(false);
});

it("accepts canonical IDs already accepted by the backend without imposing a UUID version", () => {
  const definition = formDefinitionFixture();
  definition.sections[4].id = "30000000-0000-0000-0000-000000000001";
  definition.sections[4].questions[0].id = "10000000-0000-0000-0000-000000000001";
  expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(true);
  definition.sections[4].id = "not-an-id";
  expect(enrollmentFormDefinitionSchema.safeParse(definition).success).toBe(false);
});
