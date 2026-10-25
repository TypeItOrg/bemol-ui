import { documentDefinitionSchema } from "@features/document-catalog/schemas/document-catalog.schema";
import { documentRequirementSchema } from "@features/enrollment-applications/schemas/document-requirement.schema";

const fields = {
  documentId: "22222222-2222-4222-8222-222222222222",
  name: "Documento",
  instructions: "",
  allowedFormats: ["image/webp"],
  active: true,
  assignments: [],
  displayOrder: 0,
  level: "OPTIONAL",
};

it.each([
  ["catalog", documentDefinitionSchema],
  ["requirement", documentRequirementSchema],
] as const)("accepts WebP but still rejects unsupported formats in the %s", (_name, schema) => {
  expect(schema.safeParse(fields).success).toBe(true);
  expect(schema.safeParse({ ...fields, allowedFormats: ["image/svg+xml"] }).success).toBe(false);
});
