"use client";

import { useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@common/components/ui/button";

import { EnrollmentApplicationApproveDialog } from "@features/enrollment-applications/components/enrollment-application-approve-dialog";
import { EnrollmentApplicationRejectDialog } from "@features/enrollment-applications/components/enrollment-application-reject-dialog";
import type { EnrollmentApplicationReviewSummary } from "@features/enrollment-applications/types/enrollment-application-review-summary.types";
import {
  ENROLLMENT_APPLICATION_STATUS,
  type EnrollmentApplicationStatus,
} from "@features/enrollment-applications/types/enrollment-application-status.types";

type EnrollmentApplicationResolvePanelProps = {
  application: EnrollmentApplicationReviewSummary;
  status: EnrollmentApplicationStatus;
  canApprove: boolean;
  canReject: boolean;
};

export function EnrollmentApplicationResolvePanel({
  application,
  status,
  canApprove,
  canReject,
}: EnrollmentApplicationResolvePanelProps): ReactElement | null {
  const router = useRouter();

  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const [showRejectDialog, setShowRejectDialog] = useState(false);

  function handleResolved(): void {
    setShowApproveDialog(false);
    setShowRejectDialog(false);
    router.refresh();
  }

  const showApprove =
    canApprove &&
    (status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED || status === ENROLLMENT_APPLICATION_STATUS.PROVISIONALLY_APPROVED) &&
    Boolean(application.canApproveProvisionally || application.canConfirm);

  const showReject = canReject && status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED;

  if (!showApprove && !showReject) {
    return null;
  }

  const containerClassName =
    showApprove && showReject
      ? "flex w-full flex-col gap-2 @2xl/page-shell:w-auto @2xl/page-shell:flex-row"
      : "flex w-full flex-col gap-2 @lg/page-shell:w-auto @lg/page-shell:flex-row";

  const buttonClassName = showApprove && showReject ? "w-full @2xl/page-shell:w-auto" : "w-full @lg/page-shell:w-auto";

  return (
    <>
      <div className={containerClassName}>
        {showApprove ? (
          <Button type="button" size="lg" className={buttonClassName} onClick={() => setShowApproveDialog(true)}>
            {application.canApproveProvisionally ? "Admitir provisoriamente" : "Confirmar inscripción definitiva"}
          </Button>
        ) : null}
        {showReject ? (
          <Button type="button" size="lg" variant="destructive" className={buttonClassName} onClick={() => setShowRejectDialog(true)}>
            Rechazar inscripción
          </Button>
        ) : null}
      </div>

      {showApproveDialog ? (
        <EnrollmentApplicationApproveDialog application={application} open onOpenChange={setShowApproveDialog} onApproved={handleResolved} />
      ) : null}

      {showRejectDialog ? (
        <EnrollmentApplicationRejectDialog application={application} open onOpenChange={setShowRejectDialog} onRejected={handleResolved} />
      ) : null}
    </>
  );
}
