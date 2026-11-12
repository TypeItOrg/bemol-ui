"use client";

import { useMemo, useState, type ReactElement } from "react";

import { ChevronDownIcon, ChevronUpIcon, TextCursorInputIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@common/components/ui/field";
import { Input } from "@common/components/ui/input";
import { Textarea } from "@common/components/ui/textarea";
import { cn } from "@common/utils/cn.util";

import { EnrollmentFormItemMenu } from "@features/enrollment-forms/components/enrollment-form-item-menu";
import { EnrollmentFormQuestionOptions } from "@features/enrollment-forms/components/enrollment-form-question-options";
import { EnrollmentFormQuestionSettings } from "@features/enrollment-forms/components/enrollment-form-question-settings";
import { EnrollmentFormRemoveDialog } from "@features/enrollment-forms/components/enrollment-form-remove-dialog";
import { ENROLLMENT_QUESTION_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import { enrollmentFormQuestionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";

export function EnrollmentFormQuestionEditor({
  question,
  index,
  total,
  disabled,
  expanded,
  onSelect,
  onChange,
  onMove,
  onRemove,
}: {
  question: EnrollmentFormQuestion;
  index: number;
  total: number;
  disabled: boolean;
  expanded: boolean;
  onSelect: () => void;
  onChange: (value: EnrollmentFormQuestion) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}): ReactElement {
  const [removing, setRemoving] = useState(false);

  const [touched, setTouched] = useState({ label: false, help: false });

  const issues = useMemo(
    () => (expanded && !disabled ? enrollmentFormQuestionSchema.safeParse(question).error?.issues : undefined),
    [question, expanded, disabled],
  );

  const labelError = touched.label ? issues?.find((issue) => issue.path[0] === "label")?.message : undefined;

  const helpError = touched.help ? issues?.find((issue) => issue.path[0] === "help")?.message : undefined;

  const optionsError = issues?.find((issue) => issue.path.length === 1 && issue.path[0] === "options")?.message;

  const choice = question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE";

  const editorId = `question-editor-${question.id}`;

  return (
    <section className={cn("bg-muted/25 @container/question-editor min-w-0 rounded-xl border", expanded ? "p-4 sm:p-5 md:p-6" : "px-4 py-2")}>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="bg-primary/10 text-primary hidden size-7 shrink-0 items-center justify-center rounded-lg @lg/question-editor:flex"
          aria-hidden="true"
        >
          <TextCursorInputIcon className="size-4.5" />
        </span>
        {expanded ? (
          <h4 className="min-w-0 flex-1 text-sm font-medium">Pregunta {index + 1}</h4>
        ) : (
          <div className="flex min-h-11 min-w-0 flex-1 items-center py-1">
            <span className="flex min-w-0 flex-1 flex-col gap-1 @lg/question-editor:flex-row @lg/question-editor:items-center @lg/question-editor:justify-between @lg/question-editor:gap-4">
              <span className="min-w-0 text-sm font-medium break-words">{question.label || "Pregunta sin título"}</span>
              <span className="text-muted-foreground shrink-0 text-xs font-normal">
                {ENROLLMENT_QUESTION_LABELS[question.type]} · {question.required ? "Obligatoria" : "Opcional"}
              </span>
            </span>
          </div>
        )}
        {!disabled ? (
          <EnrollmentFormItemMenu
            label={`la pregunta ${index + 1}`}
            index={index}
            total={total}
            disabled={disabled}
            onMove={onMove}
            onRemove={() => setRemoving(true)}
            inlineOrder="responsive"
            align="end"
          />
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={`${expanded ? "Cerrar" : "Abrir"} edición de la pregunta ${index + 1}`}
          aria-expanded={expanded}
          aria-controls={expanded ? editorId : undefined}
          onClick={onSelect}
        >
          {expanded ? <ChevronUpIcon aria-hidden="true" /> : <ChevronDownIcon aria-hidden="true" />}
        </Button>
      </div>
      {expanded ? (
        <FieldSet id={editorId} className="gap-3 pt-2">
          <FieldLegend className="sr-only">Pregunta {index + 1}</FieldLegend>
          <Field data-invalid={Boolean(labelError)}>
            <FieldLabel htmlFor={`label-${question.id}`} required>
              Nombre
            </FieldLabel>
            <Textarea
              rows={1}
              className="min-h-9 py-1.5"
              id={`label-${question.id}`}
              value={question.label}
              onChange={(event) => onChange({ ...question, label: event.target.value })}
              onBlur={() => setTouched((value) => ({ ...value, label: true }))}
              disabled={disabled}
              maxLength={500}
              placeholder="Escribí la pregunta"
              aria-invalid={Boolean(labelError)}
              aria-describedby={labelError ? `label-${question.id}-error` : undefined}
            />
            <FieldError id={`label-${question.id}-error`}>{labelError}</FieldError>
          </Field>
          <EnrollmentFormQuestionSettings question={question} disabled={disabled} onChange={onChange} />
          <Field data-invalid={Boolean(helpError)}>
            <FieldLabel htmlFor={`help-${question.id}`}>Ayuda</FieldLabel>
            <Input
              id={`help-${question.id}`}
              className="focus-visible:ring-inset"
              value={question.help ?? ""}
              onChange={(event) => onChange({ ...question, help: event.target.value || null })}
              onBlur={() => setTouched((value) => ({ ...value, help: true }))}
              maxLength={1000}
              disabled={disabled}
              aria-invalid={Boolean(helpError)}
              aria-describedby={helpError ? `help-${question.id}-error` : undefined}
            />
            <FieldError id={`help-${question.id}-error`}>{helpError}</FieldError>
          </Field>
          {choice ? (
            <EnrollmentFormQuestionOptions question={question} index={index} disabled={disabled} error={optionsError} onChange={onChange} />
          ) : null}
        </FieldSet>
      ) : null}
      {removing ? (
        <EnrollmentFormRemoveDialog
          title={`¿Quitar la pregunta ${index + 1}?`}
          description="Se quitará esta pregunta. Esta acción no se puede deshacer."
          cancelLabel="Conservar pregunta"
          confirmLabel="Quitar pregunta"
          disabled={disabled}
          onOpenChange={setRemoving}
          onRemove={onRemove}
        />
      ) : null}
    </section>
  );
}
