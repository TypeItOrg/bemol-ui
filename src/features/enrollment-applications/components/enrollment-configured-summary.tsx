"use client";

import type { ReactElement, ReactNode } from "react";

import { ClipboardListIcon, Music2Icon, SlidersHorizontalIcon } from "lucide-react";

import { Alert, AlertDescription } from "@common/components/ui/alert";
import { cn } from "@common/utils/cn.util";

import type { AcademicScope } from "@features/academic/utils/academic-scope.util";
import { DetailCard, DetailItem } from "@features/enrollment-applications/components/enrollment-detail-card";
import { EnrollmentDocuments } from "@features/enrollment-applications/components/enrollment-documents";
import { EnrollmentHealthSummary } from "@features/enrollment-applications/components/enrollment-health-summary";
import { EnrollmentPersonalSummary } from "@features/enrollment-applications/components/enrollment-personal-summary";
import { EnrollmentPreferenceSummary } from "@features/enrollment-applications/components/enrollment-preference-summary";
import { EnrollmentResponsibleSummary } from "@features/enrollment-applications/components/enrollment-responsible-summary";
import { EnrollmentSchoolingSummary } from "@features/enrollment-applications/components/enrollment-schooling-summary";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";
import { formatEnrollmentAnswer } from "@features/enrollment-applications/utils/enrollment-form.util";
import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";

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

  const cards = parsed.data.sections.flatMap((section) => {
    const node = renderSection(section);

    return node ? [{ id: section.id, fullWidth: section.nativeBlock === "DOCUMENTATION", node }] : [];
  });

  const fullWidthIds = getFullWidthCardIds(cards);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {cards.map((card) => (
        <div key={card.id} className={cn("grid min-w-0", fullWidthIds.has(card.id) && "xl:col-span-2")}>
          {card.node}
        </div>
      ))}
    </div>
  );

  function renderSection(section: EnrollmentFormDefinition["sections"][number]): ReactNode {
    const props = { title: section.title };

    switch (section.nativeBlock) {
      case "PERSONAL_DATA":
        return <EnrollmentPersonalSummary {...props} personal={data.personalData ?? {}} />;
      case "SCHOOLING":
        return <EnrollmentSchoolingSummary {...props} academic={data.academicBackground ?? {}} />;
      case "HEALTH_INCLUSION":
        return <EnrollmentHealthSummary {...props} health={data.healthInclusion ?? {}} />;
      case "RESPONSIBLE":
        return data.responsible?.fullName ? <EnrollmentResponsibleSummary {...props} responsible={data.responsible} /> : null;
      case "ACADEMIC_SELECTION":
        return (
          <DetailCard {...props} icon={Music2Icon} description="Trayecto elegido para la inscripción.">
            <dl>
              <DetailItem label="Trayecto formativo" value={application.trainingPathName} fallback="Sin trayecto formativo" />
            </dl>
          </DetailCard>
        );
      case "PREFERENCES":
        return <EnrollmentPreferenceSummary {...props} preference={data.preference ?? {}} />;
      case "PREFERRED_SHIFT":
        return (
          <DetailCard {...props} icon={SlidersHorizontalIcon} description="Preferencia declarada para la cursada.">
            <dl>
              <DetailItem label="Turno preferente" value={data.preference?.preferredShift} fallback="Sin preferencia de turno" />
            </dl>
          </DetailCard>
        );
      case "DOCUMENTATION":
        return (
          <EnrollmentDocuments
            title={section.title}
            application={application}
            scope={scope}
            showRequirementChanges={showRequirementChanges}
            administrativeView={administrativeView}
          />
        );
      default:
        return (
          <DetailCard {...props} icon={ClipboardListIcon} description="Respuestas registradas en esta versión del formulario.">
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
  }
}

// A half-width card left alone in its row stretches to fill it.
function getFullWidthCardIds(cards: { id: string; fullWidth: boolean }[]): Set<string> {
  const ids = new Set<string>();

  let rowOpen = false;

  cards.forEach((card, index) => {
    if (card.fullWidth) {
      ids.add(card.id);
      rowOpen = false;

      return;
    }

    if (!rowOpen && (index === cards.length - 1 || cards[index + 1].fullWidth)) {
      ids.add(card.id);

      return;
    }

    rowOpen = !rowOpen;
  });

  return ids;
}
