import { z } from "zod";

import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";

export const enrollmentFormScopeSchema = z.enum(["institutional", "platform"]);

const name = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .refine((value) => !/[\u0000\uD800-\uDFFF]/u.test(value), "El nombre contiene caracteres no válidos.");

const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

const version = { formId: z.uuid(), versionId: z.uuid(), expectedRevision: revision };
export const enrollmentFormCommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("create"), name }),
  z.object({ kind: z.literal("rename"), formId: z.uuid(), name, expectedRevision: revision }),
  z.object({ kind: z.literal("draft"), formId: z.uuid(), sourceVersionId: z.uuid() }),
  z.object({ kind: z.literal("save"), ...version, definition: enrollmentFormDefinitionSchema }),
  z.object({ kind: z.literal("publish"), ...version }),
  z.object({ kind: z.literal("archive"), ...version }),
  z.object({ kind: z.literal("assign"), trainingPathId: z.uuid(), academicYearId: z.uuid(), formVersionId: z.uuid() }),
  z.object({ kind: z.literal("reassign"), assignmentId: z.uuid(), formVersionId: z.uuid(), expectedRevision: revision }),
  z.object({ kind: z.literal("unassign"), assignmentId: z.uuid(), expectedRevision: revision }),
]);
