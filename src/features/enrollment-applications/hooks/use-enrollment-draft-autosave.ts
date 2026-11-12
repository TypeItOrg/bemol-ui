"use client";

import { startTransition, useActionState, useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { useDebouncedValue } from "@common/hooks/use-debounced-value";
import { getErrorMessage } from "@common/utils/error-message.util";

import { updateEnrollmentDraftAction } from "@features/enrollment-applications/actions/enrollment-application.actions";
import { ENROLLMENT_MESSAGES } from "@features/enrollment-applications/constants/enrollment-messages.constants";
import { enrollmentAnswerIssues } from "@features/enrollment-applications/schemas/enrollment-custom-answers.schema";
import type { EnrollmentApplicationData } from "@features/enrollment-applications/types/enrollment-application-data.types";
import type { EnrollmentApplicationResponse } from "@features/enrollment-applications/types/enrollment-application-response.types";
import { ENROLLMENT_APPLICATION_STATUS } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { EnrollmentMutationError, unwrapEnrollmentResult } from "@features/enrollment-applications/utils/unwrap-enrollment-result.util";

export function useEnrollmentDraftAutosave({
  application,
  readOnly,
  isSubmitDialogOpen,
  isCancelDialogOpen,
  structuredData,
  selectedTrainingPathId,
  setApplication,
}: {
  application: EnrollmentApplicationResponse;
  readOnly: boolean;
  isSubmitDialogOpen: boolean;
  isCancelDialogOpen: boolean;
  structuredData: EnrollmentApplicationData;
  selectedTrainingPathId: string;
  setApplication: Dispatch<SetStateAction<EnrollmentApplicationResponse>>;
}) {
  const [autosaveState, saveDraft, saving] = useActionState(
    async (_previous: { error?: string; conflict?: boolean }, save: () => Promise<{ error?: string; conflict?: boolean }>) => save(),
    {},
  );

  const draftSaveQueue = useRef<Promise<void>>(Promise.resolve());

  const revision = useRef(application.draftRevision ?? 0);

  const conflict = useRef(false);

  const [saveConflict, setSaveConflict] = useState(false);

  const lastSavedData = useRef<string | null>(null);

  const initialized = useRef(false);

  const dataSignature = JSON.stringify(structuredData);

  const debouncedSignature = useDebouncedValue(dataSignature, 800);

  const definition = application.formVersionId ? application.formDefinition : undefined;

  const pauseForConflict = useCallback(() => {
    conflict.current = true;
    setSaveConflict(true);
  }, []);

  const persist = useCallback(
    (data: EnrollmentApplicationData): Promise<EnrollmentApplicationResponse> => {
      const request = draftSaveQueue.current.then(async () => {
        if (conflict.current) {
          throw new EnrollmentMutationError(ENROLLMENT_MESSAGES.DRAFT_REVISION_CONFLICT, 409);
        }

        const issues = enrollmentAnswerIssues(definition, data.customAnswers, false);

        if (issues.length) {
          throw new EnrollmentMutationError(issues[0].message, 400);
        }

        try {
          const updated = await updateEnrollmentDraftAction(
            application.applicationId,
            { data, expectedRevision: revision.current },
            application.personId,
          ).then(unwrapEnrollmentResult);

          revision.current = updated.draftRevision ?? revision.current;
          lastSavedData.current = JSON.stringify(data);
          setApplication((current) => ({
            ...current,
            updatedAt: updated.updatedAt,
            draftRevision: revision.current,
          }));

          return updated;
        } catch (error) {
          if (error instanceof EnrollmentMutationError && error.status === 409) {
            pauseForConflict();
          }

          throw error;
        }
      });

      draftSaveQueue.current = request.then(
        () => undefined,
        () => undefined,
      );

      return request;
    },
    [application.applicationId, application.personId, definition, setApplication, pauseForConflict],
  );

  const canSave = application.status === ENROLLMENT_APPLICATION_STATUS.DRAFT && !readOnly && !isSubmitDialogOpen && !isCancelDialogOpen;

  const currentPath = structuredData.careerSelection?.trainingPathId === (selectedTrainingPathId || undefined);

  const target = canSave && currentPath && debouncedSignature === dataSignature ? application.applicationId : null;

  useEffect(() => {
    if (!target) {
      return;
    }

    if (!initialized.current) {
      initialized.current = true;
      lastSavedData.current = debouncedSignature;

      return;
    }

    if (lastSavedData.current === debouncedSignature || conflict.current) {
      return;
    }

    let active = true;

    async function save(): Promise<{ error?: string; conflict?: boolean }> {
      await Promise.resolve();

      if (!active) {
        return {};
      }

      try {
        await persist(JSON.parse(debouncedSignature) as EnrollmentApplicationData);

        return {};
      } catch (error) {
        return { error: getErrorMessage(error, ENROLLMENT_MESSAGES.DRAFT_SAVE_FAILED), conflict: conflict.current };
      }
    }

    startTransition(() => saveDraft(save));

    return () => {
      active = false;
    };
  }, [target, debouncedSignature, persist, saveDraft]);

  return { saving, saveError: autosaveState.error, saveConflict, draftSaveQueue, persistDraft: persist, pauseForConflict };
}
