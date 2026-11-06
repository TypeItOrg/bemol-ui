import { z } from "zod";

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Usá hasta ${max} caracteres.`)
    .nullable()
    .transform((value) => value || null);
}

export const enrollmentPdfScopeSchema = z.enum(["institutional", "platform"]);

export const enrollmentPdfSettingsSchema = z.object({
  title: z.string().trim().min(1, "Ingresá un título.").max(150, "Usá hasta 150 caracteres."),
  headerText: optionalText(500),
  introductionText: optionalText(1000),
  footerText: optionalText(500),
  showApplicantSignature: z.boolean(),
  showResponsibleSignature: z.boolean(),
});

const explicitBoolean = z.enum(["true", "false"], "Seleccioná una opción válida.").transform((value) => value === "true");

export const enrollmentPdfSettingsFormSchema = enrollmentPdfSettingsSchema.extend({
  showApplicantSignature: explicitBoolean,
  showResponsibleSignature: explicitBoolean,
});

export function parseEnrollmentPdfSettingsForm(form: FormData) {
  return enrollmentPdfSettingsFormSchema.safeParse({
    title: form.get("title"),
    headerText: form.get("headerText"),
    introductionText: form.get("introductionText"),
    footerText: form.get("footerText"),
    showApplicantSignature: form.get("showApplicantSignature"),
    showResponsibleSignature: form.get("showResponsibleSignature"),
  });
}
