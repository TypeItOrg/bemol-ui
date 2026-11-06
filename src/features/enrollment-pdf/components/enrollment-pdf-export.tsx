import type { ReactElement } from "react";

import { Button } from "@common/components/ui/button";

import type { EnrollmentApplicationStatus } from "@features/enrollment-applications/types/enrollment-application-status.types";

const EXPORTABLE_STATUSES: readonly EnrollmentApplicationStatus[] = ["SUBMITTED", "PROVISIONALLY_APPROVED", "APPROVED", "REJECTED"];

export function EnrollmentPdfExport({ href, status }: { href: string; status: EnrollmentApplicationStatus }): ReactElement | null {
  if (!EXPORTABLE_STATUSES.includes(status)) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
      <Button asChild variant="outline" size="lg">
        <a href={href} target="_blank" rel="noopener noreferrer">
          Exportar
          <span className="sr-only"> (abre en una nueva pestaña)</span>
        </a>
      </Button>
    </div>
  );
}
