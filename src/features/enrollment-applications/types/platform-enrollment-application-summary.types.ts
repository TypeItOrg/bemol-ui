export type PlatformEnrollmentApplicationSummary = {
  institutionId: string;
  applicationId: string;
  applicantName: string;
  canApproveProvisionally?: boolean;
  canConfirm?: boolean;
};
