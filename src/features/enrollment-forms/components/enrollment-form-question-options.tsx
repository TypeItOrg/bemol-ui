"use client";

import { useState, type ReactElement } from "react";

import { PlusIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";

import { EnrollmentFormItemMenu } from "@features/enrollment-forms/components/enrollment-form-item-menu";
import { enrollmentFormOptionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import { moveEnrollmentItem } from "@features/enrollment-forms/utils/enrollment-form-editor.util";

export function EnrollmentFormQuestionOptions({
  question,
  index,
  disabled,
  error,
  onChange,
}: {
  question: EnrollmentFormQuestion;
  index: number;
  disabled: boolean;
  error?: string;
  onChange: (value: EnrollmentFormQuestion) => void;
}): ReactElement {
  const [touched, setTouched] = useState<string[]>([]);

  return (
    <FieldGroup aria-describedby={error ? `options-${question.id}-error` : undefined}>
      <p className="text-sm font-medium">Opciones de respuesta</p>
      {question.options.map((option, optionIndex) => {
        const optionError =
          !disabled && touched.includes(option.id) ? enrollmentFormOptionSchema.safeParse(option).error?.issues[0]?.message : undefined;

        return (
          <div key={option.id} className="flex items-start gap-2">
            {!disabled ? (
              <EnrollmentFormItemMenu
                label={`la opción ${optionIndex + 1} de la pregunta ${index + 1}`}
                index={optionIndex}
                total={question.options.length}
                disabled={disabled}
                onMove={(delta) => onChange({ ...question, options: moveEnrollmentItem(question.options, optionIndex, delta) })}
                onRemove={() => onChange({ ...question, options: question.options.filter((item) => item.id !== option.id) })}
                inlineOrder="responsive"
              />
            ) : null}
            <Field className="min-w-0 flex-1" data-invalid={Boolean(optionError)}>
              <FieldLabel htmlFor={`option-${option.id}`} className="sr-only">
                Opción {optionIndex + 1} de la pregunta {index + 1}
              </FieldLabel>
              <Input
                id={`option-${option.id}`}
                value={option.label}
                maxLength={150}
                disabled={disabled}
                placeholder={`Opción ${optionIndex + 1}`}
                aria-invalid={Boolean(optionError)}
                aria-describedby={optionError ? `option-${option.id}-error` : undefined}
                onBlur={() => setTouched((ids) => (ids.includes(option.id) ? ids : [...ids, option.id]))}
                onChange={(event) =>
                  onChange({
                    ...question,
                    options: question.options.map((item) => (item.id === option.id ? { ...item, label: event.target.value } : item)),
                  })
                }
              />
              <FieldError id={`option-${option.id}-error`}>{optionError}</FieldError>
            </Field>
          </div>
        );
      })}
      <FieldError id={`options-${question.id}-error`}>{error}</FieldError>
      {!disabled ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-fit"
          disabled={question.options.length >= 100}
          onClick={() => onChange({ ...question, options: [...question.options, { id: crypto.randomUUID(), label: "" }] })}
        >
          <PlusIcon aria-hidden="true" /> Agregar opción
        </Button>
      ) : null}
    </FieldGroup>
  );
}
