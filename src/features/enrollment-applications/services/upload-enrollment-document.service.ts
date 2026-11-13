import { uploadWithPresignedUrl } from "@common/services/presigned-upload.service";

import { confirmDocumentUpload, presignDocumentUpload } from "@features/enrollment-applications/actions/document-upload.actions";
import { DOCUMENT_MESSAGES } from "@features/enrollment-applications/constants/documentation.constants";
import type { DocumentActionState } from "@features/enrollment-applications/types/document-action-state.types";

export function uploadEnrollmentDocument(
  scope: string,
  applicationId: string,
  requirementId: string,
  file: File,
  personId?: string,
): Promise<DocumentActionState> {
  return uploadWithPresignedUrl(
    file,
    (metadata) => presignDocumentUpload(scope, applicationId, requirementId, metadata, personId),
    ({ uploadId }, metadata) => confirmDocumentUpload(scope, applicationId, requirementId, { ...metadata, uploadId }, personId),
    DOCUMENT_MESSAGES.failed,
  );
}
