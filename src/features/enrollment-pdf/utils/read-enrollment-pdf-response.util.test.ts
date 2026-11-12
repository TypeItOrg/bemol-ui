import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";

import { enrollmentPdfDataFixture } from "@features/enrollment-pdf/testing/enrollment-pdf-data.fixture";
import { readEnrollmentPdfResponse } from "@features/enrollment-pdf/utils/read-enrollment-pdf-response.util";
import { renderEnrollmentPdf } from "@features/enrollment-pdf/utils/render-enrollment-pdf.util";

jest.mock("@features/enrollment-pdf/utils/render-enrollment-pdf.util", () => ({ renderEnrollmentPdf: jest.fn() }));

beforeEach(() => {
  jest.mocked(renderEnrollmentPdf).mockResolvedValue(new Blob(["%PDF-example"], { type: "application/pdf" }));
});

it("renders valid PDF data in the browser", async () => {
  const blob = await readEnrollmentPdfResponse(Response.json(enrollmentPdfDataFixture), "No disponible");

  expect(blob.size).toBeGreaterThan(0);
  expect(renderEnrollmentPdf).toHaveBeenCalledWith(enrollmentPdfDataFixture);
});

it("rejects HTML login pages, malformed data and failed or empty renders", async () => {
  await expect(
    readEnrollmentPdfResponse(new Response("<html>Ingreso</html>", { headers: { "content-type": "text/html" } }), "No disponible"),
  ).rejects.toThrow("No disponible");
  await expect(readEnrollmentPdfResponse(Response.json({ title: "Incompleto" }), "No disponible")).rejects.toThrow("No disponible");
  jest.mocked(renderEnrollmentPdf).mockRejectedValueOnce(new Error("font"));
  await expect(readEnrollmentPdfResponse(Response.json(enrollmentPdfDataFixture), "No disponible")).rejects.toThrow("No disponible");
  jest.mocked(renderEnrollmentPdf).mockResolvedValueOnce(new Blob([]));
  await expect(readEnrollmentPdfResponse(Response.json(enrollmentPdfDataFixture), "No disponible")).rejects.toThrow("No disponible");
  expect(renderEnrollmentPdf).toHaveBeenCalledTimes(2);
});

it("preserves business messages and handles plaintext rate limits", async () => {
  await expect(
    readEnrollmentPdfResponse(Response.json({ message: "La solicitud es un borrador." }, { status: 409 }), "No disponible"),
  ).rejects.toThrow("La solicitud es un borrador.");
  await expect(readEnrollmentPdfResponse(new Response("Too many requests", { status: 429 }), "No disponible")).rejects.toThrow(
    RATE_LIMIT_ERROR_MESSAGE,
  );
});
