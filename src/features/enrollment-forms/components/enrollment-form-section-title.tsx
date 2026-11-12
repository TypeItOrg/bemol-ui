"use client";

import { useState, type ReactElement } from "react";

import { Field, FieldError, FieldLabel } from "@common/components/ui/field";
import { Textarea } from "@common/components/ui/textarea";

import { enrollmentFormSectionTitleSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";

export function EnrollmentFormSectionTitle({
  id,
  title,
  editing,
  disabled,
  readOnly,
  onChange,
  onFinish,
}: {
  id: string;
  title: string;
  editing: boolean;
  disabled: boolean;
  readOnly: boolean;
  onChange: (value: string) => void;
  onFinish: (restoreFocus: boolean) => void;
}): ReactElement {
  const [touched, setTouched] = useState(false);

  const validation = enrollmentFormSectionTitleSchema.safeParse(title);

  const error = touched && !disabled ? validation.error?.issues[0]?.message : undefined;

  function finishEditing(restoreFocus = false) {
    setTouched(true);

    if (validation.success) {
      onFinish(restoreFocus);
    }
  }

  if (readOnly || (!editing && validation.success)) {
    return (
      <h3 id={`section-${id}`} tabIndex={-1} className="min-h-9 py-1 text-base leading-6 font-semibold break-words">
        {title || "Sección sin título"}
      </h3>
    );
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={`section-${id}`} className="sr-only">
        Título de la sección
      </FieldLabel>
      <Textarea
        id={`section-${id}`}
        className="selection:bg-primary selection:text-primary-foreground min-h-9 py-1 text-base leading-6 font-semibold md:text-base"
        rows={1}
        value={title}
        maxLength={150}
        placeholder="Título de la sección"
        disabled={disabled}
        autoFocus
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `section-${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value.replace(/[\r\n]/g, ""))}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            finishEditing(true);
          }
        }}
        onBlur={() => finishEditing()}
        onFocus={(event) => event.currentTarget.select()}
      />
      <FieldError id={`section-${id}-error`}>{error}</FieldError>
    </Field>
  );
}
