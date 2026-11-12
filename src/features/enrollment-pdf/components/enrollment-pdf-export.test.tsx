import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import type { EnrollmentApplicationStatus } from "@features/enrollment-applications/types/enrollment-application-status.types";
import { EnrollmentPdfExport } from "@features/enrollment-pdf/components/enrollment-pdf-export";
import { enrollmentPdfDataFixture } from "@features/enrollment-pdf/testing/enrollment-pdf-data.fixture";

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@features/enrollment-pdf/utils/render-enrollment-pdf.util", () => ({
  renderEnrollmentPdf: jest.fn(async () => new Blob(["%PDF-example"], { type: "application/pdf" })),
}));

const href = "/api/institutional/self-service/person/enrollment-applications/22222222-2222-4222-8222-222222222222/pdf";
const exportButtonName = "Exportar (abre en una nueva pestaña)";

beforeEach(() => {
  global.fetch = jest.fn();
  URL.createObjectURL = jest.fn(() => "blob:solicitud");
});

it.each<EnrollmentApplicationStatus>(["DRAFT", "CANCELLED"])("does not offer export for %s", (status) => {
  render(<EnrollmentPdfExport href={href} status={status} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it.each<EnrollmentApplicationStatus>(["SUBMITTED", "PROVISIONALLY_APPROVED", "APPROVED", "REJECTED"])(
  "renders an allowed %s PDF in the browser and opens it in a separate tab",
  async (status) => {
    const tab = { opener: {} };
    jest.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    jest.mocked(fetch).mockResolvedValue(Response.json(enrollmentPdfDataFixture));
    const user = userEvent.setup();
    render(<EnrollmentPdfExport href={href} status={status} />);

    await user.click(screen.getByRole("button", { name: exportButtonName }));

    await waitFor(() => expect(window.open).toHaveBeenCalledWith("blob:solicitud", "_blank"));
    expect(tab.opener).toBeNull();
    expect(fetch).toHaveBeenCalledWith(href, { cache: "no-store" });
  },
);

it("explains backend errors without opening a tab", async () => {
  jest.spyOn(window, "open");
  jest.mocked(fetch).mockResolvedValue(Response.json({ message: "La solicitud es un borrador." }, { status: 409 }));
  const user = userEvent.setup();
  render(<EnrollmentPdfExport href={href} status="SUBMITTED" />);

  await user.click(screen.getByRole("button", { name: exportButtonName }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("La solicitud es un borrador."));
  expect(window.open).not.toHaveBeenCalled();
});

it("downloads the PDF when the browser blocks the tab", async () => {
  jest.spyOn(window, "open").mockReturnValue(null);
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  jest.mocked(fetch).mockResolvedValue(Response.json(enrollmentPdfDataFixture));
  const user = userEvent.setup();
  render(<EnrollmentPdfExport href={href} status="APPROVED" />);

  await user.click(screen.getByRole("button", { name: exportButtonName }));

  await waitFor(() => expect(clickSpy).toHaveBeenCalled());
  expect(toast.error).not.toHaveBeenCalled();
  clickSpy.mockRestore();
});
