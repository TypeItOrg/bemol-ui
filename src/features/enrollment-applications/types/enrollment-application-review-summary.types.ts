export type EnrollmentApplicationReviewSummary = {
  institutionId: string;
  applicationId: string;
  applicantName: string;
  canApproveProvisionally?: boolean;
  canConfirm?: boolean;
};
