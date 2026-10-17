"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import type { z } from "zod";

import { useEnrollmentDraftAutosave } from "@features/enrollment-applications/hooks/use-enrollment-draft-autosave";
import { useEnrollmentWizardCourses } from "@features/enrollment-applications/hooks/use-enrollment-wizard-courses";
import { useEnrollmentWizardForm } from "@features/enrollment-applications/hooks/use-enrollment-wizard-form";
import { useEnrollmentWizardNavigation } from "@features/enrollment-applications/hooks/use-enrollment-wizard-navigation";
import type { EnrollmentWizardProps } from "@features/enrollment-applications/types/enrollment-wizard-props.types";
import { submitEnrollmentWizard } from "@features/enrollment-applications/utils/submit-enrollment-wizard.util";

export function useEnrollmentWizard(props: EnrollmentWizardProps) {
  const {
    initialApplication,
    initialShifts = [],
    readOnly: requestedReadOnly = false,
    returnTo = `/self-service/${initialApplication.personId}/enrollment-applications`,
  } = props;

  const router = useRouter();

  const readOnly = requestedReadOnly || initialApplication.periodOpen === false;

  const [application, setApplication] = useState(initialApplication);

  const [documentsBlocked, setDocumentsBlocked] = useState(false);

  const blockedDocumentsRef = useRef(new Set<string>());

  const [confirmation, setConfirmation] = useState<"cancel" | "submit" | null>(null);

  const isCancelDialogOpen = confirmation === "cancel";

  const isSubmitDialogOpen = confirmation === "submit";

  const [validationIssues, setValidationIssues] = useState<z.ZodIssue[]>([]);

  const [submissionError, setSubmissionError] = useState<string>();

  const courses = useEnrollmentWizardCourses(props, setValidationIssues);

  const form = useEnrollmentWizardForm(initialApplication.data, initialShifts, readOnly, courses.selectedCourseIds);

  const hasDocumentsStep =
    Boolean(application.canReadAttachments) && (application.documents?.some((requirement) => requirement.active !== false) ?? false);

  const actingForOtherPerson = props.actingForOtherPerson ?? false;

  const requiresRepresentative = actingForOtherPerson || form.isMinor;

  const navigation = useEnrollmentWizardNavigation(requiresRepresentative, hasDocumentsStep, isSubmitDialogOpen);

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
      setApplication,
      router,
    });

    if (result.error || result.issues?.length) {
      setSubmissionError(result.error);
      setIsSubmitDialogOpen(false);

      if (result.error || result.issues?.some((issue) => issue.path[0] === "documents")) {
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
