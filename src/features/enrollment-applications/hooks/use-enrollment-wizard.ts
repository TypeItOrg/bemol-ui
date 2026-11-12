"use client";

import { useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import type { z } from "zod";

import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import { useEnrollmentDraftAutosave } from "@features/enrollment-applications/hooks/use-enrollment-draft-autosave";
import { useEnrollmentWizardCourses } from "@features/enrollment-applications/hooks/use-enrollment-wizard-courses";
import { useEnrollmentWizardForm } from "@features/enrollment-applications/hooks/use-enrollment-wizard-form";
import { useEnrollmentWizardNavigation } from "@features/enrollment-applications/hooks/use-enrollment-wizard-navigation";
import type { EnrollmentWizardProps } from "@features/enrollment-applications/types/enrollment-wizard-props.types";
import { submitEnrollmentWizard } from "@features/enrollment-applications/utils/submit-enrollment-wizard.util";
import { enrollmentFormDefinitionSchema } from "@features/enrollment-forms/schemas/enrollment-form-definition.schema";

export function useEnrollmentWizard(props: EnrollmentWizardProps) {
  const {
    initialApplication,
    initialShifts = [],
    readOnly: requestedReadOnly = false,
    returnTo = `/self-service/${initialApplication.personId}/enrollment-applications`,
  } = props;

  const router = useRouter();

  const configuredForm = useMemo(() => {
    if (!initialApplication.formVersionId) {
      return { definition: undefined, error: undefined };
    }

    const parsed = enrollmentFormDefinitionSchema.safeParse(initialApplication.formDefinition);

    if (!parsed.success || !Number.isSafeInteger(initialApplication.draftRevision) || (initialApplication.draftRevision ?? -1) < 0) {
      return { definition: undefined, error: ENROLLMENT_MESSAGES.FORM_VERSION_LOAD_FAILED };
    }

    return { definition: parsed.data, error: undefined };
  }, [initialApplication.formVersionId, initialApplication.formDefinition, initialApplication.draftRevision]);

  const definition = configuredForm.definition;

  const readOnly = requestedReadOnly || initialApplication.periodOpen === false || Boolean(configuredForm.error);

  const [application, setApplication] = useState(initialApplication);

  const [documentsBlocked, setDocumentsBlocked] = useState(false);

  const blockedDocumentsRef = useRef(new Set<string>());

  const [confirmation, setConfirmation] = useState<"cancel" | "submit" | null>(null);

  const isCancelDialogOpen = confirmation === "cancel";

  const isSubmitDialogOpen = confirmation === "submit";

  const [validationIssues, setValidationIssues] = useState<z.ZodIssue[]>([]);

  const [submissionError, setSubmissionError] = useState<string>();

  const courses = useEnrollmentWizardCourses(props, setValidationIssues);

  const form = useEnrollmentWizardForm(initialApplication.data, initialShifts, readOnly, courses.selectedCourseIds, definition);

  const hasDocumentsStep =
    Boolean(application.canReadAttachments) && (application.documents?.some((requirement) => requirement.active !== false) ?? false);

  const actingForOtherPerson = props.actingForOtherPerson ?? false;

  const requiresRepresentative = actingForOtherPerson || form.isMinor;

  const navigation = useEnrollmentWizardNavigation(requiresRepresentative, hasDocumentsStep, isSubmitDialogOpen, definition);

  const autosave = useEnrollmentDraftAutosave({
    application,
    readOnly,
    isSubmitDialogOpen,
    isCancelDialogOpen,
    structuredData: form.structuredData,
    selectedTrainingPathId: form.selectedTrainingPathId,
    setApplication,
  });

  function setIsCancelDialogOpen(open: boolean): void {
    if (open) {
      setConfirmation("cancel");

      return;
    }

    setConfirmation((current) => (current === "cancel" ? null : current));
  }

  function setIsSubmitDialogOpen(open: boolean): void {
    if (open && autosave.saveConflict) {
      setSubmissionError(ENROLLMENT_MESSAGES.DRAFT_REVISION_SUBMIT_CONFLICT);

      return;
    }

    if (open) {
      setConfirmation("submit");

      return;
    }

    setConfirmation((current) => (current === "submit" ? null : current));
  }

  function changeDocumentBlocked(id: string, blocked: boolean): void {
    if (blocked) {
      blockedDocumentsRef.current.add(id);
    } else {
      blockedDocumentsRef.current.delete(id);
    }

    setDocumentsBlocked(blockedDocumentsRef.current.size > 0);
  }

  async function submitApplication(): Promise<{ error?: string; issues?: z.ZodIssue[] }> {
    setSubmissionError(undefined);
    setValidationIssues([]);

    const result = await submitEnrollmentWizard({
      blockedDocumentsRef,
      application,
      isCancelDialogOpen,
      setValidationIssues,
      setInvalidInstrumentGroups: courses.setInvalidInstrumentGroups,
      pendingInstrumentGroups: courses.pendingInstrumentGroups,
      structuredData: form.structuredData,
      selectedTrainingPathId: form.selectedTrainingPathId,
      courseOptions: courses.courseOptions,
      selectedCourseIds: courses.selectedCourseIds,
      handleActiveTabChange: navigation.handleActiveTabChange,
      isMinor: form.isMinor,
      actingForOtherPerson,
      setPendingFocusFieldId: navigation.setPendingFocusFieldId,
      draftSaveQueue: autosave.draftSaveQueue,
      persistDraft: autosave.persistDraft,
      onConflict: autosave.pauseForConflict,
      definition,
      setApplication,
      router,
    });

    if (result.error || result.issues?.length) {
      setSubmissionError(result.error);
      setIsSubmitDialogOpen(false);

      if ((result.error && !result.issues?.length) || result.issues?.some((issue) => issue.path[0] === "documents")) {
        navigation.setPendingFocusFieldId("enrollment-validation-alert");
      }
    }

    return result;
  }

  function getFieldError(path: (string | number)[]): string | undefined {
    return validationIssues.find((issue) => issue.path.length === path.length && issue.path.every((value, index) => value === path[index]))?.message;
  }

  return {
    ...form,
    ...courses,
    ...navigation,
    ...autosave,
    application,
    definition,
    definitionError: configuredForm.error,
    initialApplication,
    readOnly,
    requestedReadOnly,
    actingForOtherPerson,
    requiresRepresentative,
    returnTo,
    documentsBlocked,
    hasDocumentsStep,
    isCancelDialogOpen,
    isSubmitDialogOpen,
    validationIssues,
    submissionError,
    router,
    setApplication,
    setIsCancelDialogOpen,
    setIsSubmitDialogOpen,
    changeDocumentBlocked,
    submitApplication,
    getFieldError,
    birthDateError: getFieldError(["personalData", "birthDate"]),
  };
}
