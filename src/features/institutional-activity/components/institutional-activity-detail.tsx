import type { ReactElement } from "react";

import { notFound } from "next/navigation";

import { MailIcon, ScrollTextIcon } from "lucide-react";

import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import {
  fetchInstitutionalActivityEvent,
  fetchInstitutionalActivityLabels,
} from "@features/institutional-activity/services/institutional-activity.service";
import { InstitutionalAccessDenied } from "@features/institutional-auth/components/institutional-access-denied";
import { InstitutionalBreadcrumb } from "@features/institutional-auth/components/institutional-breadcrumb";
import { requireInstitutionalUser } from "@features/institutional-auth/services/get-institutional-user.service";
import { INSTITUTIONAL_PERMISSION } from "@features/institutional-auth/types/institutional-permission.types";
import { hasInstitutionalPermission } from "@features/institutional-auth/utils/institutional-permission.util";
import { AuditEventDetail } from "@features/platform-audit/components/audit-event-detail";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export async function InstitutionalActivityDetail({
  eventId,
  returnTo: rawReturnTo,
  mailView,
}: {
  eventId: string;
  returnTo?: string | string[];
  mailView: boolean;
}): Promise<ReactElement> {
  const user = await requireInstitutionalUser();

  if (!hasInstitutionalPermission(user, mailView ? INSTITUTIONAL_PERMISSION.EMAIL_READ : INSTITUTIONAL_PERMISSION.AUDIT_READ)) {
    return <InstitutionalAccessDenied />;
  }

  if (!isValidUuid(eventId)) {
    notFound();
  }

  const event = await fetchInstitutionalActivityEvent(user.institutionId, eventId, mailView);

  if (!event) {
    notFound();
  }

  const returnTo = getSafeReturnTo(rawReturnTo, mailView ? "/emails" : "/audit-events");

  const title = mailView ? "Detalle del correo" : "Detalle de evento";

  const labels =
    !mailView && (event.action === "PERSON_ROLES_CHANGED" || event.entityType === "ROLE" || typeof event.details.initialRole === "string")
      ? await fetchInstitutionalActivityLabels(user.institutionId)
      : { roleLabels: {}, permissionLabels: {} };

  return (
    <PlatformPageShell
      title={title}
      breadcrumb={
        <InstitutionalBreadcrumb segmentLabels={{ [eventId]: title }} segmentHrefs={{ [mailView ? "emails" : "audit-events"]: returnTo }} />
      }
      actions={<PlatformPageIcon icon={mailView ? MailIcon : ScrollTextIcon} />}
    >
      <AuditEventDetail event={event} returnTo={returnTo} roleLabels={labels.roleLabels} permissionLabels={labels.permissionLabels} />
    </PlatformPageShell>
  );
}
