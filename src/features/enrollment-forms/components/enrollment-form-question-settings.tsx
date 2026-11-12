"use client";

import type { ReactElement } from "react";

import { Field, FieldLabel } from "@common/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";

import { ENROLLMENT_QUESTION_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import type { EnrollmentFormQuestionType } from "@features/enrollment-forms/types/enrollment-form-question-type.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import { newEnrollmentQuestion } from "@features/enrollment-forms/utils/enrollment-form-editor.util";

export function EnrollmentFormQuestionSettings({
  question,
  disabled,
  onChange,
}: {
  question: EnrollmentFormQuestion;
  disabled: boolean;
  onChange: (value: EnrollmentFormQuestion) => void;
}): ReactElement {
  function changeType(type: EnrollmentFormQuestionType) {
    if (type === question.type) {
      return;
    }

    const choice = question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE";

    const replacement = newEnrollmentQuestion(type);

    onChange({
      ...replacement,
      label: question.label,
      help: question.help,
      required: question.required,
      options: choice && (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") ? question.options : replacement.options,
    });
  }

  return (
    <div className="grid min-w-0 gap-3 @md/question-editor:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={`type-${question.id}`}>Tipo de respuesta</FieldLabel>
        <Select value={question.type} onValueChange={(value) => changeType(value as EnrollmentFormQuestionType)} disabled={disabled}>
          <SelectTrigger id={`type-${question.id}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(ENROLLMENT_QUESTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="px-2.5 py-1.5">
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={`required-${question.id}`}>Obligatoriedad</FieldLabel>
        <Select
          value={String(question.required)}
          disabled={disabled}
          onValueChange={(value) => {
            if (value === "true" || value === "false") {
              onChange({ ...question, required: value === "true" });
            }
          }}
        >
          <SelectTrigger id={`required-${question.id}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="false" className="px-2.5 py-1.5">
                Opcional
              </SelectItem>
              <SelectItem value="true" className="px-2.5 py-1.5">
                Obligatoria
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
