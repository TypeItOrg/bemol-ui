import type { ReactElement } from "react";

import Link from "next/link";

import { ScrollTextIcon } from "lucide-react";

import { ReturnToLink } from "@common/components/navigation/return-to-link";
import { SectionHeader } from "@common/components/section-header";
import { Button } from "@common/components/ui/button";

import { AUDIT_ACTION_LABELS } from "@features/platform-audit/constants/audit-labels.constants";
import { fetchAuditEvents } from "@features/platform-audit/services/fetch-audit-events.service";
import type { AuditEvent } from "@features/platform-audit/types/audit-event.types";
import { auditInstitutionName, formatAuditDateTime } from "@features/platform-audit/utils/audit-display.util";

export async function PlatformAccountRecentActivity({ accountId }: { accountId: string }): Promise<ReactElement> {
  const params = new URLSearchParams({ actorKind: "PLATFORM", actorId: accountId });

  let events: AuditEvent[] | null;

  try {
    const data = await fetchAuditEvents({ page: 0, size: 5, actorKind: "PLATFORM", actorId: accountId });

    events = data.items;
  } catch {
    events = null;
  }

  return (
    <section className="bg-muted/25 space-y-5 rounded-xl border p-4 sm:p-5">
      <SectionHeader
        icon={ScrollTextIcon}
        title="Actividad reciente"
        description="Las últimas cinco acciones registradas de este administrador."
        descriptionBreakpoint="sm"
        action={
          <Button asChild variant="outline" size="lg">
            <Link href={`/audit-events?${params}`}>Ver en Auditoría</Link>
          </Button>
        }
      />
      {events === null && (
        <p role="alert" className="text-destructive text-sm">
          No se pudo cargar la actividad reciente. Intentá nuevamente desde Auditoría.
        </p>
      )}
      {events?.length === 0 && <p className="text-muted-foreground text-sm">Este administrador todavía no tiene actividad registrada.</p>}
      {events !== null && events.length > 0 && (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="bg-background flex min-w-0 flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <ReturnToLink href={`/audit-events/${event.id}`} className="text-sm font-medium break-words underline-offset-4 hover:underline">
                  {AUDIT_ACTION_LABELS[event.action] ?? event.action}
                </ReturnToLink>
                {event.institutionId ? <p className="text-muted-foreground mt-1 text-sm break-words">{auditInstitutionName(event)}</p> : null}
              </div>
              <time dateTime={event.occurredAt} className="text-muted-foreground shrink-0 text-sm tabular-nums">
                {formatAuditDateTime(event.occurredAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
