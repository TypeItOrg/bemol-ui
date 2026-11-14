"use client";

import { useState, type ReactElement } from "react";

import { toast } from "sonner";

import { Button } from "@common/components/ui/button";
import { cn } from "@common/utils/cn.util";

import type { EnrollmentApplicationStatus } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { ENROLLMENT_PDF_MESSAGES } from "@features/enrollment-pdf/constants/enrollment-pdf.constants";
import { readEnrollmentPdfResponse } from "@features/enrollment-pdf/utils/read-enrollment-pdf-response.util";

const EXPORTABLE_STATUSES: readonly EnrollmentApplicationStatus[] = ["SUBMITTED", "PROVISIONALLY_APPROVED", "APPROVED", "REJECTED"];

export function EnrollmentPdfExport({
  className,
  href,
  status,
}: {
  className?: string;
  href: string;
  status: EnrollmentApplicationStatus;
}): ReactElement | null {
  const [pending, setPending] = useState(false);

  if (!EXPORTABLE_STATUSES.includes(status)) {
    return null;
  }

  async function exportPdf(): Promise<void> {
    setPending(true);

    try {
      const response = await fetch(href, { cache: "no-store" });

      const blob = await readEnrollmentPdfResponse(response, ENROLLMENT_PDF_MESSAGES.download);

      // The blob URL lives while this page is open, so the viewer can reload and save it.
      const url = URL.createObjectURL(blob);

      const tab = window.open(url, "_blank");

      if (tab) {
        tab.opener = null;
      } else {
        // Popup blocked after the async render; downloading is never blocked.
        const link = document.createElement("a");

        link.href = url;
        link.download = "solicitud-de-inscripcion.pdf";
        link.click();
      }
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : ENROLLMENT_PDF_MESSAGES.download);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn("w-full @xs/page-shell:w-auto", className)}
      disabled={pending}
      aria-busy={pending}
      onClick={() => void exportPdf()}
    >
      {pending ? "Exportando…" : "Exportar"}
      <span className="sr-only"> (abre en una nueva pestaña)</span>
    </Button>
  );
}
