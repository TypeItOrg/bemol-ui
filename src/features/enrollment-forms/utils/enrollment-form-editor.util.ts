import { ENROLLMENT_CORE_BLOCKS, ENROLLMENT_NATIVE_LABELS } from "@features/enrollment-forms/constants/enrollment-form.constants";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentFormNativeBlock } from "@features/enrollment-forms/types/enrollment-form-native-block.types";
import type { EnrollmentFormQuestionType } from "@features/enrollment-forms/types/enrollment-form-question-type.types";
import type { EnrollmentFormQuestion } from "@features/enrollment-forms/types/enrollment-form-question.types";
import type { EnrollmentFormSection } from "@features/enrollment-forms/types/enrollment-form-section.types";

export function moveEnrollmentItem<T>(items: T[], index: number, delta: number): T[] {
  const destination = index + delta;

  if (destination < 0 || destination >= items.length) {
    return items;
  }

  const copy = [...items];

  [copy[index], copy[destination]] = [copy[destination], copy[index]];

  return copy;
}

export function enrollmentBlockLocked(block: EnrollmentFormNativeBlock | null): boolean {
  return block !== null && ENROLLMENT_CORE_BLOCKS.includes(block);
}

export function newEnrollmentSection(block: EnrollmentFormNativeBlock | null): EnrollmentFormSection {
  return { id: crypto.randomUUID(), title: block ? ENROLLMENT_NATIVE_LABELS[block] : "Nueva sección", nativeBlock: block, questions: [] };
}

export function newEnrollmentQuestion(type: EnrollmentFormQuestionType = "SHORT_TEXT"): EnrollmentFormQuestion {
  return {
    id: crypto.randomUUID(),
    label: "",
    help: null,
    type,
    required: false,
    options: type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" ? [{ id: crypto.randomUUID(), label: "" }] : [],
  };
}

export function reconcileEnrollmentPdf(definition: EnrollmentFormDefinition): EnrollmentFormDefinition {
  return {
    ...definition,
    pdfSections: (definition.pdfSections.length ? explicitEnrollmentPdf(definition) : []).flatMap((printed) => {
      const section = definition.sections.find((value) => value.id === printed.sectionId);

      if (!section) {
        return [];
      }

      const ids = printed.questionIds.filter((id) => section.questions.some((question) => question.id === id));

      if (printed.questionIds.length && !ids.length) {
        return [];
      }

      return [{ ...printed, questionIds: ids }];
    }),
  };
}

export function explicitEnrollmentPdf(definition: EnrollmentFormDefinition) {
  const entries = definition.pdfSections.length
    ? definition.pdfSections
    : definition.sections
        .filter((section) => section.nativeBlock !== "DOCUMENTATION")
        .map((section) => ({ sectionId: section.id, questionIds: [] as string[] }));

  const missingCore = definition.sections.filter(
    (section) =>
      enrollmentBlockLocked(section.nativeBlock) &&
      section.nativeBlock !== "DOCUMENTATION" &&
      !entries.some((entry) => entry.sectionId === section.id),
  );

  return [...missingCore.map((section) => ({ sectionId: section.id, questionIds: [] as string[] })), ...entries];
}

// Hidden sections keep their form position next to their nearest preceding section
export function orderedEnrollmentPdfSections(definition: EnrollmentFormDefinition, entries: EnrollmentFormDefinition["pdfSections"]) {
  const ordered = entries.map((entry) => definition.sections.find((section) => section.id === entry.sectionId)).filter((item) => item !== undefined);

  definition.sections.forEach((section, formIndex) => {
    if (ordered.includes(section)) {
      return;
    }

    const previous = definition.sections
      .slice(0, formIndex)
      .reverse()
      .find((item) => ordered.includes(item));

    ordered.splice(previous ? ordered.indexOf(previous) + 1 : 0, 0, section);
  });

  return ordered;
}

export function showEnrollmentPdfSection(entries: EnrollmentFormDefinition["pdfSections"], ordered: EnrollmentFormSection[], sectionId: string) {
  const position = ordered.findIndex((section) => section.id === sectionId);

  const insertAt = entries.filter((entry) => ordered.findIndex((section) => section.id === entry.sectionId) < position).length;

  return [...entries.slice(0, insertAt), { sectionId, questionIds: [] }, ...entries.slice(insertAt)];
}

// Returns no explicit layout when it matches the form order and content
export function normalizeEnrollmentPdf(definition: EnrollmentFormDefinition, pdfSections: EnrollmentFormDefinition["pdfSections"]) {
  const expand = (entries: EnrollmentFormDefinition["pdfSections"]) =>
    entries.map((entry) => ({
      sectionId: entry.sectionId,
      questionIds: entry.questionIds.length
        ? entry.questionIds
        : (definition.sections.find((section) => section.id === entry.sectionId)?.questions.map((question) => question.id) ?? []),
    }));

  const current = expand(explicitEnrollmentPdf({ ...definition, pdfSections }));

  const initial = expand(explicitEnrollmentPdf({ ...definition, pdfSections: [] }));

  return JSON.stringify(current) === JSON.stringify(initial) ? [] : pdfSections;
}

export function enrollmentFormIssueTarget(definition: EnrollmentFormDefinition, path: PropertyKey[]) {
  if (path[0] !== "sections" || typeof path[1] !== "number") {
    return undefined;
  }

  const section = definition.sections[path[1]];

  const question = path[2] === "questions" && typeof path[3] === "number" ? section?.questions[path[3]] : undefined;

  let fieldId: string | undefined;

  if (question) {
    const option = path[4] === "options" && typeof path[5] === "number" ? question.options[path[5]] : undefined;

    const field = path[4] === "help" ? "help" : "label";

    fieldId = option ? `option-${option.id}` : `${field}-${question.id}`;
  }

  return { sectionId: section?.id, questionId: question?.id, fieldId, sectionTitle: section?.title };
}
