import { z } from "zod";

const text = (max: number) =>
  z
    .string()
    .min(1, "Completá este texto.")
    .max(max, `Usá hasta ${max} caracteres.`)
    .refine((value) => value.trim().length > 0, "Completá este texto.")
    .refine((value) => !/[\u0000\uD800-\uDFFF]/u.test(value), "El texto contiene caracteres no válidos.");

export const enrollmentFormNativeBlockSchema = z.enum([
  "PERSONAL_DATA",
  "RESPONSIBLE",
  "ACADEMIC_SELECTION",
  "DOCUMENTATION",
  "SCHOOLING",
  "HEALTH_INCLUSION",
  "PREFERENCES",
  "PREFERRED_SHIFT",
]);
export const enrollmentFormQuestionTypeSchema = z.enum(["SHORT_TEXT", "LONG_TEXT", "NUMBER", "DATE", "BOOLEAN", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]);
export const enrollmentFormSectionTitleSchema = text(150);

export const enrollmentFormOptionSchema = z.object({ id: z.guid(), label: text(150) });

export const enrollmentFormQuestionSchema = z
  .object({
    id: z.guid(),
    label: text(500),
    help: z
      .string()
      .max(1000)
      .refine((value) => !/[\u0000\uD800-\uDFFF]/u.test(value), "El texto contiene caracteres no válidos.")
      .nullable(),
    type: enrollmentFormQuestionTypeSchema,
    required: z.boolean(),
    options: z.array(enrollmentFormOptionSchema).max(100),
  })
  .superRefine((value, ctx) => {
    const choice = value.type === "SINGLE_CHOICE" || value.type === "MULTIPLE_CHOICE";

    if (choice ? value.options.length === 0 : value.options.length !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: choice ? "Agregá al menos una opción." : "Este tipo de pregunta no admite opciones.",
      });
    }
  });

const section = z
  .object({
    id: z.guid(),
    title: enrollmentFormSectionTitleSchema,
    nativeBlock: enrollmentFormNativeBlockSchema.nullable(),
    questions: z.array(enrollmentFormQuestionSchema).max(200),
  })
  .superRefine((value, ctx) => {
    if (value.nativeBlock && value.questions.length) {
      ctx.addIssue({ code: "custom", path: ["questions"], message: "Los bloques de Bemol conservan sus propios campos." });
    }
  });

export const enrollmentFormDefinitionSchema = z
  .object({
    sections: z.array(section).max(40),
    pdfSections: z.array(z.object({ sectionId: z.guid(), questionIds: z.array(z.guid()).max(200) })).max(40),
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();

    const blocks = new Set<string>();

    let questionCount = 0;

    for (const item of value.sections) {
      for (const id of [item.id, ...item.questions.flatMap((field) => [field.id, ...field.options.map((entry) => entry.id)])]) {
        if (ids.has(id)) {
          ctx.addIssue({ code: "custom", message: "Las secciones, preguntas y opciones deben tener identificadores únicos." });
        }

        ids.add(id);
      }

      questionCount += item.questions.length;

      if (item.nativeBlock) {
        if (blocks.has(item.nativeBlock)) {
          ctx.addIssue({ code: "custom", message: "No se puede repetir un bloque de Bemol." });
        }

        blocks.add(item.nativeBlock);
      }
    }

    if (questionCount > 200 || (blocks.has("PREFERENCES") && blocks.has("PREFERRED_SHIFT"))) {
      ctx.addIssue({
        code: "custom",
        message: questionCount > 200 ? "El formulario admite hasta 200 preguntas." : "Turno preferido ya está incluido en Preferencias.",
      });
    }

    const printed = new Set<string>();

    for (const entry of value.pdfSections) {
      const source = value.sections.find((item) => item.id === entry.sectionId);

      if (
        !source ||
        printed.has(entry.sectionId) ||
        new Set(entry.questionIds).size !== entry.questionIds.length ||
        entry.questionIds.some((id) => !source.questions.some((field) => field.id === id))
      ) {
        ctx.addIssue({ code: "custom", path: ["pdfSections"], message: "La configuración del PDF contiene referencias inválidas." });
      }

      printed.add(entry.sectionId);
    }
  });
