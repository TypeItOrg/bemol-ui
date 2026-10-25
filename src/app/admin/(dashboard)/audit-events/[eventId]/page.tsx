import type { ReactElement } from "react";

import { notFound, redirect } from "next/navigation";

import { ScrollTextIcon } from "lucide-react";

import { getSafeReturnTo } from "@common/utils/return-to.util";
import { isValidUuid } from "@common/utils/uuid.util";

import { fetchSystemRolesCatalog } from "@features/people/services/fetch-system-roles.service";
import { AuditEventDetail } from "@features/platform-audit/components/audit-event-detail";
import { fetchAuditEvent } from "@features/platform-audit/services/fetch-audit-events.service";
import { PlatformBreadcrumb } from "@features/platform-auth/components/platform-breadcrumb";
import { PlatformPageIcon } from "@features/platform-auth/components/platform-page-icon";
import { PlatformPageShell } from "@features/platform-auth/components/platform-page-shell";
import { fetchPlatformPermissionGroups } from "@features/roles/services/platform-role.service";

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
    redirect(`/admin/emails/${eventId}`);
  }

  const returnTo = getSafeReturnTo((await searchParams).returnTo, "/admin/audit-events");

  const [roleCatalog, permissionGroups] = await Promise.all([
    event.action === "PERSON_ROLES_CHANGED" || typeof event.details.initialRole === "string" ? fetchSystemRolesCatalog() : null,
    event.entityType === "ROLE" ? fetchPlatformPermissionGroups() : [],
  ]);

  const roleLabels = Object.fromEntries(roleCatalog?.roles.map((role) => [role.code, role.displayName]) ?? []);

  const permissionLabels = Object.fromEntries(
    permissionGroups.flatMap((group) => group.permissions.map((permission) => [permission.code, permission.description])),
  );

  return (
    <PlatformPageShell
      title="Detalle de evento"
      breadcrumb={<PlatformBreadcrumb segmentLabels={{ [eventId]: "Detalle de evento" }} segmentHrefs={{ "audit-events": returnTo }} />}
      actions={<PlatformPageIcon icon={ScrollTextIcon} />}
    >
      <AuditEventDetail event={event} returnTo={returnTo} roleLabels={roleLabels} permissionLabels={permissionLabels} />
    </PlatformPageShell>
  );
}
