import { enrollmentPdfSettingsSchema, parseEnrollmentPdfSettingsForm } from "@features/enrollment-pdf/schemas/enrollment-pdf-settings.schema";

const settings = {
  title: "Solicitud de inscripción",
  headerText: null,
  introductionText: null,
  footerText: null,
  showApplicantSignature: true,
  showResponsibleSignature: false,
};

function form(): FormData {
  const value = new FormData();

  for (const [key, field] of Object.entries(settings)) {
    value.set(key, field === null ? "" : String(field));
  }

  return value;
}

it("normalizes optional blank texts and preserves explicit negative answers", () => {
  const value = form();
  value.set("title", " Solicitud de inscripción ");
  value.set("headerText", "  Ministerio\nDirección  ");
  value.set("footerText", "  ");

  expect(parseEnrollmentPdfSettingsForm(value)).toMatchObject({
    success: true,
    data: { ...settings, headerText: "Ministerio\nDirección" },
  });
});

it.each([undefined, "on", "", "0"])("rejects missing or ambiguous boolean setting value %s", (value) => {
  const data = form();

  if (value === undefined) {
    data.delete("showResponsibleSignature");
  } else {
    data.set("showResponsibleSignature", value);
  }

  expect(parseEnrollmentPdfSettingsForm(data).success).toBe(false);
});

it.each([
  ["title", 150],
  ["headerText", 500],
  ["introductionText", 1000],
  ["footerText", 500],
])("enforces the %s length boundary", (key, max) => {
  expect(enrollmentPdfSettingsSchema.safeParse({ ...settings, [key]: "x".repeat(Number(max)) }).success).toBe(true);
  expect(enrollmentPdfSettingsSchema.safeParse({ ...settings, [key]: "x".repeat(Number(max) + 1) }).success).toBe(false);
});

it("rejects an empty title and non-boolean preview parameters", () => {
  expect(enrollmentPdfSettingsSchema.safeParse({ ...settings, title: " " }).success).toBe(false);
  expect(enrollmentPdfSettingsSchema.safeParse({ ...settings, showApplicantSignature: "false" }).success).toBe(false);
});
