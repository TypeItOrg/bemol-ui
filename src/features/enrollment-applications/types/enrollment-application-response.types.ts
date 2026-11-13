import type { EnrollmentApplicationCourse } from "@features/enrollment-applications/types/enrollment-application-course.types";
import type { EnrollmentApplicationData } from "@features/enrollment-applications/types/enrollment-application-data.types";
import type { EnrollmentApplicationStatus } from "@features/enrollment-applications/types/enrollment-application-status.types";
import type { EnrollmentFormDefinition } from "@features/enrollment-forms/types/enrollment-form-definition.types";
import type { EnrollmentPeriod } from "@features/enrollment-periods/types/enrollment-period.types";

export interface EnrollmentApplicationResponse {
  formVersionId?: string | null;
  formDefinition?: EnrollmentFormDefinition | null;
  draftRevision?: number;
  applicationId: string;
  institutionId: string;
  personId: string;
  /** Person who submitted it: the tutor when the application was made on behalf of a dependent. */
  submittedByPersonId?: string | null;
  trainingPathId?: string | null;
  academicYearId: string | null;
  enrollmentPeriodId: string;
  enrollmentPeriod?: EnrollmentPeriod;
  periodOpen?: boolean;
  canReadAttachments?: boolean;
  canRequestDocuments?: boolean;
  documentRequests?: import("@features/enrollment-applications/types/enrollment-document-request.types").EnrollmentDocumentRequest[];
  documents?: import("@features/enrollment-applications/types/document-requirement.types").DocumentRequirement[];
  canApproveProvisionally?: boolean;
  canConfirm?: boolean;
  admissionHistory?: Array<{
    id: string;
    status: string;
    occurredAt: string;
    actorId: string | null;
    accountType: string;
  }>;
  trainingPathName?: string | null;
  academicYear?: number | null;
  enrollmentPeriodName?: string;
  status: EnrollmentApplicationStatus;
  pendingCourses?: boolean | null;
  isEditable: boolean;
  data: EnrollmentApplicationData;
  courses?: EnrollmentApplicationCourse[];
  applicantName?: string;
  applicantDocumentNumber?: string;
  secondarySchool?: string | null;
  rejectionReason?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}
