"use client";

import { useState, type ReactElement } from "react";

import { Checkbox } from "@common/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@common/components/ui/select";
import { Textarea } from "@common/components/ui/textarea";

import { customAnswerFieldId } from "@features/enrollment-applications/utils/enrollment-form.util";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import type { EnrollmentFormSection } from "@features/enrollment-forms/types/enrollment-form-section.types";
import { parseEnrollmentFormNumber } from "@features/enrollment-forms/utils/enrollment-form-number.util";

export function EnrollmentQuestionFields({
  section,
  answers,
  onChange,
  disabled = false,
  errors = {},
  idPrefix,
}: {
  section: EnrollmentFormSection;
  answers: Record<string, unknown>;
  onChange: (questionId: string, value: unknown) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  idPrefix?: string;
}): ReactElement {
  return (
    <div className="space-y-5">
      {section.questions.map((question) => {
        const id = customAnswerFieldId(question.id, idPrefix);

        const error = errors[question.id];

        const value = answers[question.id];

        return (
          <Field key={question.id} data-invalid={Boolean(error)}>
            <FieldLabel id={`${id}-label`} htmlFor={id} required={question.required}>
              {question.label}
            </FieldLabel>
            {question.help ? <FieldDescription id={`${id}-help`}>{question.help}</FieldDescription> : null}
            <QuestionInput
              question={question}
              value={value}
              id={id}
              disabled={disabled}
              invalid={Boolean(error)}
              describedBy={[question.help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
              onChange={(next) => onChange(question.id, next)}
            />
            <FieldError id={`${id}-error`} errors={[{ message: error }]} />
          </Field>
        );
      })}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  id,
  disabled,
  invalid,
  describedBy,
  onChange,
}: {
  question: EnrollmentFormQuestion;
  value: unknown;
  id: string;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: unknown) => void;
}): ReactElement {
  const common = { id, disabled, "aria-invalid": invalid, "aria-describedby": describedBy };

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div id={id} aria-describedby={describedBy} role="group" aria-labelledby={`${id}-label`} tabIndex={-1} className="space-y-3 outline-none">
        {question.options.map((option) => (
          <div key={option.id} className="flex items-start gap-3">
            <Checkbox
              id={`${id}-${option.id}`}
              disabled={disabled}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              checked={selected.includes(option.id)}
              onCheckedChange={(checked) => onChange(checked === true ? [...selected, option.id] : selected.filter((item) => item !== option.id))}
            />
            <label htmlFor={`${id}-${option.id}`} className="min-w-0 text-sm leading-snug break-words">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "BOOLEAN" || question.type === "SINGLE_CHOICE") {
    const booleanValue = typeof value === "boolean" ? String(value) : "__empty";

    const choiceValue = typeof value === "string" && value ? value : "__empty";

    const current = question.type === "BOOLEAN" ? booleanValue : choiceValue;

    const options =
      question.type === "BOOLEAN"
        ? [
            { id: "true", label: "Sí" },
            { id: "false", label: "No" },
          ]
        : question.options;

    return (
      <Select
        disabled={disabled}
        value={current}
        onValueChange={(next) => {
          if (next === "__empty") {
            onChange(null);

            return;
          }

          onChange(question.type === "BOOLEAN" ? next === "true" : next);
        }}
      >
        <SelectTrigger {...common} className="w-full">
          <SelectValue placeholder="Seleccioná una opción" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="__empty" className="px-2.5 py-1.5">
              Sin responder
            </SelectItem>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id} className="px-2.5 py-1.5">
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  if (question.type === "LONG_TEXT") {
    return (
      <Textarea
        {...common}
        value={typeof value === "string" ? value : ""}
        maxLength={10000}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "NUMBER") {
    return <NumberAnswerInput id={id} value={value} disabled={disabled} invalid={invalid} describedBy={describedBy} onChange={onChange} />;
  }

  return (
    <Input
      {...common}
      type={question.type === "DATE" ? "date" : "text"}
      maxLength={question.type === "SHORT_TEXT" ? 500 : undefined}
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      onChange={(event) => onChange(event.target.value || (question.type === "DATE" ? null : ""))}
    />
  );
}

function NumberAnswerInput({
  id,
  value,
  disabled,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  value: unknown;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: unknown) => void;
}): ReactElement {
  const [editing, setEditing] = useState<string | null>(null);

  const displayed = typeof value === "string" || typeof value === "number" ? String(value) : "";

  return (
    <Input
      id={id}
      inputMode="decimal"
      disabled={disabled}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      value={editing ?? displayed}
      onBlur={() => setEditing(null)}
      onChange={(event) => {
        const raw = event.target.value;

        setEditing(raw);
        onChange(parseEnrollmentFormNumber(raw));
      }}
    />
  );
}
