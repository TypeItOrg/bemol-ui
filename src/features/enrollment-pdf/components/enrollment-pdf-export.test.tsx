import { render, screen } from "@testing-library/react";

import type { EnrollmentApplicationStatus } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { EnrollmentPdfExport } from "@features/enrollment-pdf/components/enrollment-pdf-export";

it.each<EnrollmentApplicationStatus>(["DRAFT", "CANCELLED"])("does not offer export for %s", (status) => {
  render(<EnrollmentPdfExport href="/api/pdf" status={status} />);

  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it.each<EnrollmentApplicationStatus>(["SUBMITTED", "PROVISIONALLY_APPROVED", "APPROVED", "REJECTED"])(
  "opens an allowed %s PDF in a separate browser tab without forcing a download",
  (status) => {
    const href = "/api/institutional/self-service/person/enrollment-applications/22222222-2222-4222-8222-222222222222/pdf";
    render(<EnrollmentPdfExport href={href} status={status} />);

    const link = screen.getByRole("link", { name: "Exportar (abre en una nueva pestaña)" });

    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).not.toHaveAttribute("download");
  },
);
