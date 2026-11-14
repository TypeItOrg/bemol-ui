"use client";

import { useState, type ReactElement } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@common/components/ui/button";

import { PlatformEnrollmentApplicationApproveDialog } from "@features/enrollment-applications/components/platform-enrollment-application-approve-dialog";
import { PlatformEnrollmentApplicationRejectDialog } from "@features/enrollment-applications/components/platform-enrollment-application-reject-dialog";
import {
  ENROLLMENT_APPLICATION_STATUS,
  type EnrollmentApplicationStatus,
} from "@features/enrollment-applications/types/enrollment-application-status.types";
import type { PlatformEnrollmentApplicationSummary } from "@features/enrollment-applications/types/platform-enrollment-application-summary.types";

type PlatformEnrollmentApplicationResolvePanelProps = {
  application: PlatformEnrollmentApplicationSummary;
  status: EnrollmentApplicationStatus;
};

export function PlatformEnrollmentApplicationResolvePanel({
  application,
  status,
}: PlatformEnrollmentApplicationResolvePanelProps): ReactElement | null {
  const router = useRouter();

  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const [showRejectDialog, setShowRejectDialog] = useState(false);

  function handleResolved(): void {
    setShowApproveDialog(false);
    setShowRejectDialog(false);
    router.refresh();
  }

  const canApprove =
    (status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED || status === ENROLLMENT_APPLICATION_STATUS.PROVISIONALLY_APPROVED) &&
    Boolean(application.canApproveProvisionally || application.canConfirm);

  const canReject = status === ENROLLMENT_APPLICATION_STATUS.SUBMITTED;

  if (!canApprove && !canReject) {
    return null;
  }

  const containerClassName =
    canApprove && canReject
      ? "flex w-full flex-col gap-2 @2xl/page-shell:w-auto @2xl/page-shell:flex-row"
      : "flex w-full flex-col gap-2 @lg/page-shell:w-auto @lg/page-shell:flex-row";

  const buttonClassName = canApprove && canReject ? "w-full @2xl/page-shell:w-auto" : "w-full @lg/page-shell:w-auto";

  return (
    <>
      <div className={containerClassName}>
        {canApprove ? (
          <Button type="button" size="lg" className={buttonClassName} onClick={() => setShowApproveDialog(true)}>
            {application.canApproveProvisionally ? "Admitir provisoriamente" : "Confirmar inscripción definitiva"}
          </Button>
        ) : null}
        {canReject ? (
          <Button type="button" size="lg" variant="destructive" className={buttonClassName} onClick={() => setShowRejectDialog(true)}>
            Rechazar inscripción
          </Button>
        ) : null}
      </div>

      {showApproveDialog ? (
        <PlatformEnrollmentApplicationApproveDialog application={application} open onOpenChange={setShowApproveDialog} onApproved={handleResolved} />
      ) : null}

      {showRejectDialog ? (
        <PlatformEnrollmentApplicationRejectDialog application={application} open onOpenChange={setShowRejectDialog} onRejected={handleResolved} />
      ) : null}
    </>
  );
}
