"use client";

import type { ReactElement } from "react";

import { ClipboardListIcon } from "lucide-react";

import { Button } from "@common/components/ui/button";
import { Card, CardContent } from "@common/components/ui/card";
import { TabsContent } from "@common/components/ui/tabs";

import { EnrollmentStepCardHeader } from "@features/enrollment-applications/components/enrollment-step-card-header";
import { EnrollmentCourseStep } from "@features/enrollment-applications/components/wizard/enrollment-course-step";
import { EnrollmentDocumentsStep } from "@features/enrollment-applications/components/wizard/enrollment-documents-step";
import { EnrollmentHealthStep } from "@features/enrollment-applications/components/wizard/enrollment-health-step";
import { EnrollmentPersonalStep } from "@features/enrollment-applications/components/wizard/enrollment-personal-step";
import { EnrollmentPreferencesStep } from "@features/enrollment-applications/components/wizard/enrollment-preferences-step";
import { EnrollmentResponsibleStep } from "@features/enrollment-applications/components/wizard/enrollment-responsible-step";
import { EnrollmentSchoolingStep } from "@features/enrollment-applications/components/wizard/enrollment-schooling-step";
import type { EnrollmentWizardModel } from "@features/enrollment-applications/types/enrollment-wizard-model.types";
import { ENROLLMENT_NATIVE_TABS } from "@features/enrollment-applications/utils/enrollment-form.util";
import { EnrollmentQuestionFields } from "@features/enrollment-forms/components/enrollment-question-fields";

export function EnrollmentConfiguredSteps({ model }: { model: EnrollmentWizardModel }): ReactElement {
  const index = model.visibleTabs.findIndex((tab) => tab.id === model.effectiveActiveTab);

  const previous = model.visibleTabs[index - 1];

  const next = model.visibleTabs[index + 1];

  function advance(): void {
    if (model.effectiveActiveTab === "spaces" && model.pendingInstrumentGroups.length) {
      model.setInvalidInstrumentGroups([...model.pendingInstrumentGroups]);
      document.getElementById(`instrument-${model.pendingInstrumentGroups[0]}`)?.focus();

      return;
    }

    if (next) {
      model.handleActiveTabChange(next.id);
    } else {
      model.setIsSubmitDialogOpen(true);
    }
  }

  return (
    <>
      {model.definition?.sections.map((section) => {
        const tabId = section.nativeBlock ? ENROLLMENT_NATIVE_TABS[section.nativeBlock] : `custom-${section.id}`;

        const tab = model.visibleTabs.find((value) => value.id === tabId);

        if (!tab) {
          return null;
        }

        const props = { ...model, stepTitle: tab.label, hideNavigation: true };

        let content: ReactElement;

        switch (section.nativeBlock) {
          case "PERSONAL_DATA":
            content = <EnrollmentPersonalStep {...props} />;
            break;
          case "SCHOOLING":
            content = <EnrollmentSchoolingStep {...props} />;
            break;
          case "HEALTH_INCLUSION":
            content = <EnrollmentHealthStep {...props} />;
            break;
          case "RESPONSIBLE":
            content = <EnrollmentResponsibleStep {...props} />;
            break;
          case "ACADEMIC_SELECTION":
            content = <EnrollmentCourseStep {...props} />;
            break;
          case "PREFERENCES":
            content = <EnrollmentPreferencesStep {...props} />;
            break;
          case "PREFERRED_SHIFT":
            content = <EnrollmentPreferencesStep {...props} shiftOnly />;
            break;
          case "DOCUMENTATION":
            content = <EnrollmentDocumentsStep {...props} />;
            break;

          default: {
            const errors = Object.fromEntries(
              section.questions.flatMap((question) => {
                const message = model.getFieldError(["customAnswers", question.id]);

                return message ? [[question.id, message]] : [];
              }),
            );

            content = (
              <TabsContent value={tabId} className="space-y-6">
                <Card className="bg-muted/25 sm:[--card-spacing:--spacing(6)]">
                  <EnrollmentStepCardHeader
                    icon={ClipboardListIcon}
                    title={tab.label}
                    description="Completá las preguntas de la institución. Los campos marcados son obligatorios."
                  />
                  <CardContent>
                    <EnrollmentQuestionFields
                      section={section}
                      answers={model.customAnswers}
                      onChange={model.updateCustomAnswer}
                      disabled={model.readOnly || model.isSubmitDialogOpen || model.isCancelDialogOpen}
                      errors={errors}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          }
        }

        return (
          <fieldset
            key={section.id}
            hidden={tabId !== model.effectiveActiveTab}
            className="min-w-0 border-0 p-0"
            disabled={model.readOnly || model.isSubmitDialogOpen || model.isCancelDialogOpen}
          >
            {content}
          </fieldset>
        );
      })}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {previous ? (
          <Button type="button" size="lg" variant="outline" onClick={() => model.handleActiveTabChange(previous.id)}>
            Atrás
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button type="button" size="lg" onClick={advance}>
            Siguiente: {next.label.replace(/^\d+\. /, "")}
          </Button>
        ) : null}
        {!next && !model.readOnly ? (
          <Button
            type="button"
            size="lg"
            onClick={advance}
            disabled={model.saving || model.saveConflict || model.documentsBlocked || model.isCancelDialogOpen}
          >
            Enviar inscripción
          </Button>
        ) : null}
      </div>
    </>
  );
}
