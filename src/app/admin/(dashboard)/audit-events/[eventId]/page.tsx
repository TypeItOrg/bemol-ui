import type { ReactElement } from "react";

import { notFound, redirect } from "next/navigation";

import { ScrollTextIcon } from "lucide-react";

import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { AuditEventDetail } from "@features/platform-audit/components/audit-event-detail";
import { fetchAuditEvent } from "@features/platform-audit/services/fetch-audit-events.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";

export const metadata = { title: "Detalle de evento", other: { "application-title": "Detalle de evento" } };

export default async function AuditEventPage({
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

  if (!event) {
    notFound();
  }

  if (event.entityType === "EMAIL") {
    redirect(`/emails/${eventId}`);
  }

  const returnTo = getSafeReturnTo((await searchParams).returnTo, "/audit-events");

  return (
    <PlatformPageShell
      title="Detalle de evento"
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [eventId]: "Detalle de evento" }} segmentHrefs={{ "audit-events": returnTo }} />}
      actions={<PlatformPageIcon icon={ScrollTextIcon} />}
    >
      <AuditEventDetail event={event} returnTo={returnTo} />
    </PlatformPageShell>
  );
}
