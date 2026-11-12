"use client";

import type { ReactElement } from "react";

import { FileTextIcon } from "lucide-react";

import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";
import { cn } from "@common/utils/cn.util";

import { EnrollmentFormOrderControls } from "@features/enrollment-forms/components/enrollment-form-order-controls";
import {
  pdfHoverRevealClassName,
  PdfLockedIndicator,
  PdfRow,
  PdfVisibilityToggle,
} from "@features/enrollment-forms/components/enrollment-form-pdf-controls";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import {
  enrollmentBlockLocked,
  explicitEnrollmentPdf,
  moveEnrollmentItem,
  normalizeEnrollmentPdf,
  orderedEnrollmentPdfSections,
  showEnrollmentPdfSection,
} from "@features/enrollment-forms/utils/enrollment-form-editor.util";

export function EnrollmentFormPdfLayout({
  definition,
  disabled,
  onChange,
}: {
  definition: EnrollmentFormDefinition;
  disabled: boolean;
  onChange: (value: EnrollmentFormDefinition) => void;
}): ReactElement {
  const entries = explicitEnrollmentPdf(definition);

  const sections = orderedEnrollmentPdfSections(definition, entries).filter(
    (section) => section.nativeBlock !== "DOCUMENTATION" && section.nativeBlock !== "ACADEMIC_SELECTION" && section.nativeBlock !== "PREFERRED_SHIFT",
  );

  const customized = normalizeEnrollmentPdf(definition, definition.pdfSections).length > 0;

  const update = (pdfSections: EnrollmentFormDefinition["pdfSections"]) =>
    onChange({ ...definition, pdfSections: normalizeEnrollmentPdf(definition, pdfSections) });

  return (
    <section aria-labelledby="enrollment-form-pdf-title" className="bg-muted/25 flex min-w-0 flex-col gap-4 rounded-xl border p-4 sm:p-5 md:p-6">
      <header className="-mx-4 border-b px-4 pb-4 sm:-mx-5 sm:px-5 sm:pb-5 md:-mx-6 md:px-6">
        <SectionHeader
          icon={FileTextIcon}
          title="Planilla de inscripción"
          titleId="enrollment-form-pdf-title"
          description="Elegí qué secciones se imprimen y en qué orden."
          action={
            <Button
              type="button"
              variant="outline"
              className="w-full @xl/section-header:w-auto"
              disabled={disabled || !customized}
              onClick={() => update([])}
            >
              Restablecer
            </Button>
          }
        />
      </header>
      <div className="divide-y">
        {sections.map((section, position) => {
          const index = entries.findIndex((entry) => entry.sectionId === section.id);

          const checked = index >= 0;

          const locked = enrollmentBlockLocked(section.nativeBlock);

          const selectedQuestions = checked ? entries[index].questionIds : [];

          const effective = selectedQuestions.length ? selectedQuestions : section.questions.map((item) => item.id);

          const visible = locked || checked;

          const sectionControls = (
            <>
              {checked ? (
                <div className={pdfHoverRevealClassName}>
                  <EnrollmentFormOrderControls
                    index={index}
                    total={entries.length}
                    label={`sección de la planilla ${section.title}`}
                    disabled={disabled}
                    onMove={(delta) => update(moveEnrollmentItem(entries, index, delta))}
                  />
                </div>
              ) : null}
              {locked ? (
                <PdfLockedIndicator label={section.title} />
              ) : (
                <PdfVisibilityToggle
                  label={section.title}
                  visible={checked}
                  disabled={disabled}
                  onToggle={() =>
                    update(
                      checked ? entries.filter((entry) => entry.sectionId !== section.id) : showEnrollmentPdfSection(entries, sections, section.id),
                    )
                  }
                />
              )}
            </>
          );

          return (
            <div key={section.id} className={cn(section.questions.length > 0 && "pb-2")}>
              <PdfRow visible={visible} controls={sectionControls}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-muted-foreground w-4 shrink-0 text-xs tabular-nums">{position + 1}</span>
                  <span className="min-w-0 text-sm font-medium break-words">{section.title}</span>
                </span>
              </PdfRow>
              {section.questions.map((question) => {
                const label = question.label || "Pregunta sin título";

                const selected = checked && effective.includes(question.id);

                return (
                  <PdfRow
                    key={question.id}
                    compact
                    visible={selected}
                    controls={
                      <PdfVisibilityToggle
                        compact
                        label={label}
                        visible={selected}
                        disabled={disabled || !checked}
                        onToggle={() => {
                          const ids = section.questions
                            .map((item) => item.id)
                            .filter((id) => (id === question.id ? !selected : effective.includes(id)));

                          update(
                            ids.length
                              ? entries.map((entry) => (entry.sectionId === section.id ? { ...entry, questionIds: ids } : entry))
                              : entries.filter((entry) => entry.sectionId !== section.id),
                          );
                        }}
                      />
                    }
                  >
                    <span className="text-muted-foreground min-w-0 pl-7 text-sm break-words">{label}</span>
                  </PdfRow>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
