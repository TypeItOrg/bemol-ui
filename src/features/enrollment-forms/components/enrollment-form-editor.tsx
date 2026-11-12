"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import { InfoIcon, ListChecksIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Alert, AlertDescription } from "@common/components/ui/alert";
import { Button } from "@common/components/ui/button";
import { isHttpResponseError } from "@common/utils/http-response-error.util";

import { EnrollmentFormBuilder } from "@features/enrollment-forms/components/enrollment-form-builder";
import { EnrollmentFormFeedback } from "@features/enrollment-forms/components/enrollment-form-feedback";
import { EnrollmentFormPdfLayout } from "@features/enrollment-forms/components/enrollment-form-pdf-layout";
import { useEnrollmentFormAutosave } from "@features/enrollment-forms/hooks/use-enrollment-form-autosave";
import type { EnrollmentFormContext } from "@features/enrollment-forms/types/enrollment-form-context.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import type { EnrollmentFormVersion } from "@features/enrollment-forms/types/enrollment-form-version.types";

export function EnrollmentFormEditor({
  context,
  version,
  onDirtyChange,
  onReload,
  onSaved,
  onBack,
  actions,
}: {
  context: EnrollmentFormContext;
  version: EnrollmentFormVersion;
  onDirtyChange: (dirty: boolean) => void;
  onReload: () => void;
  onSaved: (version: EnrollmentFormVersion) => void;
  onBack: () => void;
  actions?: ReactNode;
}): ReactElement {
  const { definition, change, editable, revision, saveStatus, mutation } = useEnrollmentFormAutosave({
    context,
    version,
    onDirtyChange,
    onSaved,
  });

  const { isPending: saving, isError: saveFailed, error: saveError, reset: resetSave } = mutation;

  const [selectedSection, setSelectedSection] = useState<string | undefined>(version.definition.sections[0]?.id);

  const [selectedQuestion, setSelectedQuestion] = useState<string>();

  const conflict = isHttpResponseError(saveError, 409);

  const disabled = !editable;

  function changeQuestionId(sectionId: string, oldId: string, replacement: EnrollmentFormQuestion) {
    change({
      sections: definition.sections.map((section) =>
        section.id === sectionId
          ? { ...section, questions: section.questions.map((question) => (question.id === oldId ? replacement : question)) }
          : section,
      ),
      pdfSections: definition.pdfSections.map((entry) => ({
        ...entry,
        questionIds: entry.questionIds.map((id) => (id === oldId ? replacement.id : id)),
      })),
    });
  }

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Volver
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2 @2xl/page-shell:flex-nowrap">
          {editable ? (
            <p role="status" className="sr-only">
              {saveStatus}
            </p>
          ) : null}
          {actions}
        </div>
      </header>
      {!editable ? (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertDescription>Esta versión es de solo lectura. Creá una nueva versión para editarla.</AlertDescription>
        </Alert>
      ) : null}
      {saveError || version.revision !== revision ? (
        <div className="space-y-4">
          <EnrollmentFormFeedback error={saveError} />
          {editable && (saveFailed || version.revision !== revision) ? (
            <div className="flex flex-wrap gap-3">
              {saveFailed && !conflict ? (
                <Button type="button" variant="outline" onClick={resetSave}>
                  Reintentar autoguardado
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={saving} onClick={onReload}>
                Descartar cambios y recargar la versión
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-4">
        <section aria-labelledby="enrollment-form-builder-title" className="bg-muted/25 min-w-0 rounded-xl border">
          <header className="border-b p-4 sm:p-5 md:p-6">
            <SectionHeader
              icon={ListChecksIcon}
              title="Formulario"
              titleId="enrollment-form-builder-title"
              description="Organizá las secciones y preguntas del formulario de inscripción."
            />
          </header>
          <EnrollmentFormBuilder
            selected={selectedSection}
            selectedQuestion={selectedQuestion}
            onSelectQuestion={setSelectedQuestion}
            onSelect={setSelectedSection}
            definition={definition}
            readOnly={!editable}
            disabled={disabled}
            onChange={change}
            onQuestionIdChange={changeQuestionId}
          />
        </section>
        <EnrollmentFormPdfLayout definition={definition} disabled={disabled} onChange={change} />
      </div>
    </div>
  );
}
