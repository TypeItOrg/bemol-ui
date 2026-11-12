import type { Dispatch, RefObject, SetStateAction } from "react";

import { useRouter } from "next/navigation";

import type { z } from "zod";

import { getErrorMessage } from "@common/utils/error-message.util";

import { submitEnrollmentApplicationAction } from "@features/enrollment-applications/actions/enrollment-application.actions";
import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import { FIELD_ID_BY_ERROR_PATH } from "@features/enrollment-applications/constants/enrollment-wizard-fields.constants";
import { createEnrollmentSubmissionSchema } from "@features/enrollment-applications/schemas/enrollment-application.schema";
import type { EnrollmentApplicationData } from "@features/enrollment-applications/types/enrollment-application-data.types";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";
import type { EnrollmentCourseOption } from "@features/enrollment-applications/types/enrollment-course-option.types";
import { customAnswerFieldId, ENROLLMENT_NATIVE_TABS } from "@features/enrollment-applications/utils/enrollment-form.util";
import { EnrollmentMutationError, unwrapEnrollmentResult } from "@features/enrollment-applications/utils/unwrap-enrollment-result.util";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";

export async function submitEnrollmentWizard({
  blockedDocumentsRef,
  application,
  isCancelDialogOpen,
  setValidationIssues,
  setInvalidInstrumentGroups,
  pendingInstrumentGroups,
  structuredData,
  selectedTrainingPathId,
  courseOptions,
  selectedCourseIds,
  handleActiveTabChange,
  isMinor,
  actingForOtherPerson = false,
  setPendingFocusFieldId,
  draftSaveQueue,
  persistDraft,
  onConflict,
  definition,
  setApplication,
  router,
}: {
  blockedDocumentsRef: RefObject<Set<string>>;
  application: EnrollmentApplicationResponse;
  isCancelDialogOpen: boolean;
  setValidationIssues: Dispatch<SetStateAction<z.ZodIssue[]>>;
  setInvalidInstrumentGroups: (groups: string[]) => void;
  pendingInstrumentGroups: string[];
  structuredData: EnrollmentApplicationData;
  selectedTrainingPathId: string;
  courseOptions: EnrollmentCourseOption[];
  selectedCourseIds: string[];
  handleActiveTabChange: (tab: string) => void;
  isMinor: boolean;
  actingForOtherPerson?: boolean;
  setPendingFocusFieldId: Dispatch<SetStateAction<string | null>>;
  draftSaveQueue: RefObject<Promise<void>>;
  persistDraft: (data: EnrollmentApplicationData) => Promise<EnrollmentApplicationResponse>;
  onConflict?: () => void;
  definition?: EnrollmentFormDefinition | null;
  setApplication: Dispatch<SetStateAction<EnrollmentApplicationResponse>>;
  router: ReturnType<typeof useRouter>;
}): Promise<{ error?: string; issues?: z.ZodIssue[] }> {
  if (blockedDocumentsRef.current.size > 0) {
    return { error: ENROLLMENT_MESSAGES.DOCUMENTS_SAVE_PENDING };
  }

  if (!application?.applicationId || isCancelDialogOpen) {
    return {};
  }

  setInvalidInstrumentGroups([...pendingInstrumentGroups]);

  const parsed = createEnrollmentSubmissionSchema(actingForOtherPerson, definition).safeParse(structuredData);

  const issues: z.ZodIssue[] = parsed.success ? [] : [...parsed.error.issues];

  if (!selectedTrainingPathId) {
    issues.push({
      code: "custom",
      message: ENROLLMENT_MESSAGES.TRAINING_PATH_REQUIRED,
      path: ["careerSelection", "trainingPathId"],
    });
  }

  if (pendingInstrumentGroups.length > 0) {
    issues.push({
      code: "custom",
      message: ENROLLMENT_MESSAGES.COURSE_INSTRUMENT_REQUIRED,
      path: ["courses"],
    });
  }

  if (courseOptions.some((course) => selectedCourseIds.includes(course.courseId) && course.eligibility?.eligible === false)) {
    issues.push({
      code: "custom",
      message: ENROLLMENT_MESSAGES.ACADEMIC_SELECTION_INVALID,
      path: ["courses"],
    });
  }

  if (issues.length > 0) {
    setValidationIssues(issues);

    focusEnrollmentIssue(issues[0], definition, handleActiveTabChange, setPendingFocusFieldId, isMinor || actingForOtherPerson);

    return { issues };
  }

  try {
    await draftSaveQueue.current;

    const savedApplication = await persistDraft(structuredData);

    setApplication(savedApplication);

    const missingDocuments = (savedApplication.documents ?? []).filter(
      (requirement) => requirement.active !== false && requirement.level === "AT_SUBMISSION" && !requirement.currentAttachment,
    );

    if (missingDocuments.length > 0) {
      const documentIssues: z.ZodIssue[] = missingDocuments.map((document) => ({
        code: "custom",
        message: document.name,
        path: ["documents", document.id],
      }));

      setValidationIssues(documentIssues);
      handleActiveTabChange("documents");

      return { issues: documentIssues };
    }

    setApplication(
      await submitEnrollmentApplicationAction(application.applicationId, application.personId, savedApplication.draftRevision ?? 0).then(
        unwrapEnrollmentResult,
      ),
    );
    router.refresh();

    return {};
  } catch (error) {
    if (error instanceof EnrollmentMutationError && error.status === 409) {
      onConflict?.();
    }

    if (error instanceof EnrollmentMutationError && error.fieldErrors) {
      const serverIssues: z.ZodIssue[] = Object.entries(error.fieldErrors).map(([field, message]) => ({
        code: "custom",
        path: field.split("."),
        message,
      }));

      setValidationIssues(serverIssues);
      focusEnrollmentIssue(serverIssues[0], definition, handleActiveTabChange, setPendingFocusFieldId, isMinor || actingForOtherPerson);

      return { error: error.message, issues: serverIssues };
    }

    return {
      error: getErrorMessage(error, ENROLLMENT_MESSAGES.SUBMISSION_FAILED),
    };
  }
}

function focusEnrollmentIssue(
  issue: z.ZodIssue | undefined,
  definition: EnrollmentFormDefinition | null | undefined,
  changeTab: (tab: string) => void,
  focus: Dispatch<SetStateAction<string | null>>,
  requiresRepresentative: boolean,
): void {
  if (!issue) {
    return;
  }

  const section = issue.path[0];

  const tabs: Record<string, string> = {
    personalData: "personal",
    academicBackground: "education",
    healthInclusion: "health",
    careerSelection: "spaces",
    courses: "spaces",
    preference: "preferences",
    documents: "documents",
  };

  if (section === "responsible" && requiresRepresentative) {
    changeTab("responsible");
  } else if (section === "customAnswers") {
    const questionId = String(issue.path[1] ?? "");

    const custom = definition?.sections.find((value) => value.questions.some((question) => question.id === questionId));

    if (custom) {
      changeTab(`custom-${custom.id}`);
      focus(customAnswerFieldId(questionId));

      return;
    }

    focus("enrollment-validation-alert");

    return;
  } else if (typeof section === "string" && tabs[section]) {
    const tab = tabs[section];

    if (definition && !definition.sections.some((item) => item.nativeBlock && ENROLLMENT_NATIVE_TABS[item.nativeBlock] === tab)) {
      focus("enrollment-validation-alert");

      return;
    }

    changeTab(tab);
  }

  const id = FIELD_ID_BY_ERROR_PATH[issue.path.join(".")];

  focus(id ?? "enrollment-validation-alert");
}
