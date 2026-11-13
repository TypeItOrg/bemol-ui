import { uploadWithPresignedUrl } from "@common/services/presigned-upload.service";
import { safelyRunAction } from "@common/utils/safe-action.util";

import { confirmGuardianDependentDocumentAction } from "@features/guardian-dependents/actions/confirm-guardian-dependent-document.action";
import { createGuardianDependentAction } from "@features/guardian-dependents/actions/create-guardian-dependent.action";
import { presignGuardianDependentDocumentAction } from "@features/guardian-dependents/actions/presign-guardian-dependent-document.action";
import { GUARDIAN_DEPENDENT_MESSAGES } from "@features/guardian-dependents/constants/guardian-dependent.constants";
import type { GuardianDependentActionState } from "@features/guardian-dependents/types/guardian-dependent-action-state.types";
import { getGuardianDocuments, validateGuardianDocuments } from "@features/guardian-dependents/utils/guardian-dependent-documents.util";

export async function submitGuardianDependent(
  institutionId: string,
  previous: GuardianDependentActionState,
  formData: FormData,
): Promise<GuardianDependentActionState> {
  const documents = getGuardianDocuments(formData);

  const documentsError = validateGuardianDocuments(documents);

  if (documentsError) {
    return { fieldErrors: { documents: documentsError } };
  }

  formData.delete("documents");

  const result = await safelyRunAction(createGuardianDependentAction(institutionId, previous, formData), GUARDIAN_DEPENDENT_MESSAGES.CREATE);

  if (!result.success) {
    return result;
  }

  for (const document of documents) {
    if (!result.personGuardianId || !(await uploadGuardianDocument(institutionId, result.personGuardianId, document))) {
      return { error: GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED, requestCreated: true };
    }
  }

  return result;
}

async function uploadGuardianDocument(institutionId: string, personGuardianId: string, document: File): Promise<boolean> {
  const result = await safelyRunAction(
    uploadWithPresignedUrl(
      document,
      (metadata) => presignGuardianDependentDocumentAction(institutionId, personGuardianId, metadata),
      ({ storageKey }, metadata) => confirmGuardianDependentDocumentAction(institutionId, personGuardianId, { ...metadata, storageKey }),
      GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED,
    ),
    GUARDIAN_DEPENDENT_MESSAGES.ATTACHMENTS_FAILED,
  );

  return !result.error;
}
