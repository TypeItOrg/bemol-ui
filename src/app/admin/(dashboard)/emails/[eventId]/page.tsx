import type { ReactElement } from "react";

import { notFound } from "next/navigation";

import { MailIcon } from "lucide-react";

import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { AuditEventDetail } from "@features/platform-audit/components/audit-event-detail";
import { fetchAuditEvent } from "@features/platform-audit/services/fetch-audit-events.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Detalle del correo" };

export default async function MailEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}): Promise<ReactElement> {
  const { eventId } = await params;

  if (!isValidUuid(eventId)) {
    notFound();
  }

  const event = await fetchAuditEvent(eventId);

  if (!event || event.entityType !== "EMAIL") {
    notFound();
  }

  const returnTo = getSafeReturnTo((await searchParams).returnTo, "/admin/emails");

  return (
    <PlatformPageShell
      title="Detalle del correo"
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [eventId]: "Detalle del correo" }} segmentHrefs={{ emails: returnTo }} />}
      actions={<PlatformPageIcon icon={MailIcon} />}
    >
      <AuditEventDetail event={event} returnTo={returnTo} roleLabels={{}} permissionLabels={{}} />
    </PlatformPageShell>
  );
}
