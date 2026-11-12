import { z } from "zod";

import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";

export const enrollmentCustomAnswersSchema = z
  .record(z.guid(), z.union([z.string(), z.number().finite(), z.boolean(), z.array(z.guid()).max(100), z.null()]))
  .refine((answers) => Object.keys(answers).length <= 200, ENROLLMENT_MESSAGES.CUSTOM_ANSWERS_LIMIT);

export function enrollmentAnswerIssues(
  definition: EnrollmentFormDefinition | null | undefined,
  answers: Record<string, unknown> | null | undefined,
  complete: boolean,
): z.ZodIssue[] {
  const questions = new Map(definition?.sections.flatMap((section) => section.questions.map((question) => [question.id, question] as const)) ?? []);

  const issues: z.ZodIssue[] = [];

  const values = answers ?? {};

  for (const [id, value] of Object.entries(values)) {
    const question = questions.get(id);

    if (!question) {
      issues.push({ code: "custom", path: ["customAnswers", id], message: ENROLLMENT_MESSAGES.CUSTOM_QUESTION_UNKNOWN });
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    const message = answerError(question, value);

    if (message) {
      issues.push({ code: "custom", path: ["customAnswers", id], message: ENROLLMENT_MESSAGES.CUSTOM_ANSWER_ERROR(question.label, message) });
    }
  }

  if (complete) {
    for (const question of questions.values()) {
      const value = values[question.id];

      const missing = value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);

      if (question.required && missing && !issues.some((issue) => issue.path[1] === question.id)) {
        issues.push({ code: "custom", path: ["customAnswers", question.id], message: ENROLLMENT_MESSAGES.CUSTOM_ANSWER_REQUIRED(question.label) });
      }
    }
  }

  return issues;
}

function answerError(question: EnrollmentFormQuestion, value: unknown): string | undefined {
  if (question.type === "SHORT_TEXT" || question.type === "LONG_TEXT") {
    if (typeof value !== "string") {
      return ENROLLMENT_MESSAGES.CUSTOM_TEXT_INVALID;
    }

    if (value.length > (question.type === "SHORT_TEXT" ? 500 : 10000)) {
      return ENROLLMENT_MESSAGES.CUSTOM_TEXT_TOO_LONG;
    }

    if (
      Array.from(value).some((character) => {
        const code = character.codePointAt(0) ?? 0;

        return code === 0 || (code >= 0xd800 && code <= 0xdfff);
      })
    ) {
      return ENROLLMENT_MESSAGES.CUSTOM_TEXT_CHARACTERS_INVALID;
    }

    return;
  }

  if (question.type === "NUMBER") {
    return typeof value === "number" && Number.isFinite(value) ? undefined : ENROLLMENT_MESSAGES.CUSTOM_NUMBER_INVALID;
  }

  if (question.type === "BOOLEAN") {
    return typeof value === "boolean" ? undefined : ENROLLMENT_MESSAGES.CUSTOM_BOOLEAN_INVALID;
  }

  if (question.type === "DATE") {
    const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;

    return date && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? undefined : ENROLLMENT_MESSAGES.CUSTOM_DATE_INVALID;
  }

  const options = new Set(question.options.map((option) => option.id));

  if (question.type === "SINGLE_CHOICE") {
    return typeof value === "string" && options.has(value) ? undefined : ENROLLMENT_MESSAGES.CUSTOM_OPTION_INVALID;
  }

  return Array.isArray(value) && value.every((id) => typeof id === "string" && options.has(id)) && new Set(value).size === value.length
    ? undefined
    : ENROLLMENT_MESSAGES.CUSTOM_OPTIONS_INVALID;
}
