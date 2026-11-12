"use client";

import type { ReactElement } from "react";

import { ClipboardListIcon, SlidersHorizontalIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";

import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { DetailCard, DetailItem } from "@features/enrollment-applications/components/enrollment-detail-card";
import { EnrollmentDocuments } from "@features/enrollment-applications/components/enrollment-documents";
import { EnrollmentHealthSummary } from "@features/enrollment-applications/components/enrollment-health-summary";
import { EnrollmentPersonalSummary } from "@features/enrollment-applications/components/enrollment-personal-summary";
import { EnrollmentPreferenceSummary } from "@features/enrollment-applications/components/enrollment-preference-summary";
import { EnrollmentResponsibleSummary } from "@features/enrollment-applications/components/enrollment-responsible-summary";
import { EnrollmentSchoolingSummary } from "@features/enrollment-applications/components/enrollment-schooling-summary";
import { EnrollmentSpacesSummary } from "@features/enrollment-applications/components/enrollment-spaces-summary";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";
import { formatEnrollmentAnswer } from "@features/enrollment-applications/utils/enrollment-form.util";
import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";

export function EnrollmentConfiguredSummary({
  application,
  scope,
  showRequirementChanges,
  administrativeView,
}: {
  application: EnrollmentApplicationResponse;
  scope: AcademicScope;
  showRequirementChanges: boolean;
  administrativeView: boolean;
}): ReactElement {
  const parsed = enrollmentFormDefinitionSchema.safeParse(application.formDefinition);

  if (!parsed.success) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudo cargar la versión del formulario. Recargá la inscripción para consultar sus respuestas.</AlertDescription>
      </Alert>
    );
  }

  const data = application.data ?? {};

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {parsed.data.sections.map((section) => {
        const props = { title: section.title };

        switch (section.nativeBlock) {
          case "PERSONAL_DATA":
            return <EnrollmentPersonalSummary key={section.id} {...props} personal={data.personalData ?? {}} />;
          case "SCHOOLING":
            return <EnrollmentSchoolingSummary key={section.id} {...props} academic={data.academicBackground ?? {}} />;
          case "HEALTH_INCLUSION":
            return <EnrollmentHealthSummary key={section.id} {...props} health={data.healthInclusion ?? {}} />;
          case "RESPONSIBLE":
            return data.responsible?.fullName ? <EnrollmentResponsibleSummary key={section.id} {...props} responsible={data.responsible} /> : null;
          case "ACADEMIC_SELECTION":
            return <EnrollmentSpacesSummary key={section.id} {...props} application={application} spaces={application.spaces ?? []} />;
          case "PREFERENCES":
            return <EnrollmentPreferenceSummary key={section.id} {...props} preference={data.preference ?? {}} />;
          case "PREFERRED_SHIFT":
            return (
              <DetailCard key={section.id} {...props} icon={SlidersHorizontalIcon} description="Preferencia declarada para la cursada.">
                <dl>
                  <DetailItem label="Turno preferente" value={data.preference?.preferredShift} fallback="Sin preferencia de turno" />
                </dl>
              </DetailCard>
            );
          case "DOCUMENTATION":
            return (
              <div key={section.id} className="xl:col-span-2">
                <EnrollmentDocuments
                  title={section.title}
                  application={application}
                  scope={scope}
                  showRequirementChanges={showRequirementChanges}
                  administrativeView={administrativeView}
                />
              </div>
            );
          default:
            return (
              <DetailCard key={section.id} {...props} icon={ClipboardListIcon} description="Respuestas registradas en esta versión del formulario.">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {section.questions.map((question) => (
                    <DetailItem
                      key={question.id}
                      className={question.type === "LONG_TEXT" ? "sm:col-span-2" : undefined}
                      label={question.label}
                      value={<span className="whitespace-pre-wrap">{formatEnrollmentAnswer(question, data.customAnswers?.[question.id])}</span>}
                    />
                  ))}
                </dl>
              </DetailCard>
            );
        }
      })}
    </div>
  );
}
