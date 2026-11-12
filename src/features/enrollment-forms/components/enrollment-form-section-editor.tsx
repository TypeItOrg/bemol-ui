"use client";

import { useRef, useState, type ReactElement } from "react";

import { ListPlusIcon, PlusIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { DropdownMenuItem } from "@common/components/ui/dropdown-menu";

import { EnrollmentFormEmptyState } from "@features/enrollment-forms/components/enrollment-form-empty-state";
import { EnrollmentFormItemMenu } from "@features/enrollment-forms/components/enrollment-form-item-menu";
import { EnrollmentFormNativePreview } from "@features/enrollment-forms/components/enrollment-form-native-preview";
import { EnrollmentFormQuestionEditor } from "@features/enrollment-forms/components/enrollment-form-question-editor";
import { EnrollmentFormRemoveDialog } from "@features/enrollment-forms/components/enrollment-form-remove-dialog";
import { EnrollmentFormSectionTitle } from "@features/enrollment-forms/components/enrollment-form-section-title";
import { ENROLLMENT_NATIVE_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import type { EnrollmentFormSection } from "@features/enrollment-forms/types/enrollment-form-section.types";
import { enrollmentBlockLocked, moveEnrollmentItem, newEnrollmentQuestion } from "@features/enrollment-forms/utils/enrollment-form-editor.util";

export function EnrollmentFormSectionEditor({
  section,
  selectedQuestion,
  onSelectQuestion,
  index,
  total,
  questionCount,
  disabled,
  readOnly,
  onChange,
  onMove,
  onRemove,
  onQuestionIdChange,
  availableBlocks,
}: {
  section: EnrollmentFormSection;
  selectedQuestion?: string;
  onSelectQuestion: (id: string | undefined) => void;
  index: number;
  total: number;
  questionCount: number;
  disabled: boolean;
  readOnly: boolean;
  onChange: (value: EnrollmentFormSection) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  onQuestionIdChange: (oldId: string, replacement: EnrollmentFormQuestion) => void;
  availableBlocks: EnrollmentFormNativeBlock[];
}): ReactElement {
  const locked = enrollmentBlockLocked(section.nativeBlock);

  const restorableBlock = section.nativeBlock
    ? undefined
    : availableBlocks.find(
        (block) =>
          block === section.replacedNativeBlock || (!section.replacedNativeBlock && ENROLLMENT_NATIVE_LABELS[block] === section.title.trim()),
      );

  const renameRequested = useRef(false);

  const [removing, setRemoving] = useState(false);

  const [renaming, setRenaming] = useState(false);

  const menuTrigger = useRef<HTMLButtonElement>(null);

  // Empty string explicitly collapses the list; an initial selection opens its first question.
  const editing =
    selectedQuestion === "" ? undefined : (section.questions.find((question) => question.id === selectedQuestion)?.id ?? section.questions[0]?.id);

  function addQuestion() {
    const question = newEnrollmentQuestion();

    onChange({ ...section, questions: [...section.questions, question] });
    onSelectQuestion(question.id);
  }

  const addButton = !readOnly ? (
    <Button type="button" variant="outline" size="lg" disabled={disabled || questionCount >= 200} onClick={addQuestion}>
      <PlusIcon aria-hidden="true" /> Agregar pregunta
    </Button>
  ) : null;

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2" aria-label={section.title || `Sección ${index + 1}`}>
      <header className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <EnrollmentFormSectionTitle
            id={section.id}
            title={section.title}
            editing={renaming}
            disabled={disabled}
            readOnly={readOnly}
            onChange={(title) => onChange({ ...section, title })}
            onFinish={(restoreFocus) => {
              setRenaming(false);

              if (restoreFocus) {
                menuTrigger.current?.focus();
              }
            }}
          />
        </div>
        {!readOnly ? (
          <EnrollmentFormItemMenu
            label={`la sección ${section.title || index + 1}`}
            index={index}
            total={total}
            disabled={disabled}
            onMove={onMove}
            onRemove={locked ? undefined : () => setRemoving(true)}
            inlineOrder="responsive"
            removeInline
            align="end"
            variant="outline"
            triggerRef={menuTrigger}
            onCloseAutoFocus={(event) => {
              if (removing) {
                event.preventDefault();
              } else if (renameRequested.current) {
                event.preventDefault();
                setRenaming(true);
              }

              renameRequested.current = false;
            }}
          >
            <DropdownMenuItem
              className="px-2.5 py-1.5"
              onSelect={() => {
                renameRequested.current = true;
              }}
            >
              Cambiar nombre
            </DropdownMenuItem>
            {section.nativeBlock && !locked ? (
              <DropdownMenuItem
                className="px-2.5 py-1.5"
                onSelect={() => {
                  onChange({ ...section, nativeBlock: null, replacedNativeBlock: section.nativeBlock, questions: [] });
                  onSelectQuestion(undefined);
                }}
              >
                Usar preguntas propias
              </DropdownMenuItem>
            ) : null}
            {restorableBlock ? (
              <DropdownMenuItem
                className="px-2.5 py-1.5"
                onSelect={() => {
                  onChange({ ...section, nativeBlock: restorableBlock, replacedNativeBlock: null, questions: [] });
                  onSelectQuestion(undefined);
                }}
              >
                Usar preguntas del sistema
              </DropdownMenuItem>
            ) : null}
          </EnrollmentFormItemMenu>
        ) : null}
      </header>
      {section.nativeBlock ? <EnrollmentFormNativePreview block={section.nativeBlock} /> : null}
      {!section.nativeBlock && !section.questions.length ? (
        <EnrollmentFormEmptyState
          icon={ListPlusIcon}
          title="Todavía no hay preguntas"
          description={readOnly ? "No hay preguntas configuradas." : "Agregá la primera pregunta para comenzar."}
          action={addButton}
        />
      ) : null}
      {!section.nativeBlock && section.questions.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-3">
            {section.questions.map((question, questionIndex) => (
              <EnrollmentFormQuestionEditor
                key={question.id}
                question={question}
                index={questionIndex}
                total={section.questions.length}
                disabled={disabled}
                expanded={editing === question.id}
                onSelect={() => onSelectQuestion(editing === question.id ? "" : question.id)}
                onChange={(replacement) => {
                  if (replacement.id !== question.id) {
                    onQuestionIdChange(question.id, replacement);
                    onSelectQuestion(replacement.id);
                  } else {
                    onChange({ ...section, questions: section.questions.map((item) => (item.id === question.id ? replacement : item)) });
                  }
                }}
                onMove={(delta) => onChange({ ...section, questions: moveEnrollmentItem(section.questions, questionIndex, delta) })}
                onRemove={() => {
                  onChange({ ...section, questions: section.questions.filter((item) => item.id !== question.id) });
                  onSelectQuestion(section.questions[questionIndex + 1]?.id ?? section.questions[questionIndex - 1]?.id);
                }}
              />
            ))}
          </div>
          {addButton}
        </div>
      ) : null}
      {removing && !locked && !readOnly ? (
        <EnrollmentFormRemoveDialog
          title={`¿Quitar ${section.title || "esta sección"}?`}
          description="Se quitarán esta sección y todas sus preguntas. Esta acción no se puede deshacer."
          cancelLabel="Conservar sección"
          confirmLabel="Quitar sección"
          disabled={disabled}
          menuTrigger={menuTrigger}
          onOpenChange={setRemoving}
          onRemove={onRemove}
        />
      ) : null}
    </section>
  );
}
