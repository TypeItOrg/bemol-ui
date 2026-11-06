import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";

import { readEnrollmentPdfResponse } from "@features/enrollment-pdf/utils/read-enrollment-pdf-response.util";

it("accepts a nonempty PDF and rejects an HTML login/error response or empty output", async () => {
  expect(
    (await readEnrollmentPdfResponse(new Response("%PDF-example", { headers: { "content-type": "application/pdf" } }), "No disponible")).size,
  ).toBeGreaterThan(0);
  await expect(
    readEnrollmentPdfResponse(new Response("<html>Ingreso</html>", { headers: { "content-type": "text/html" } }), "No disponible"),
  ).rejects.toThrow("No disponible");
  await expect(readEnrollmentPdfResponse(new Response("", { headers: { "content-type": "application/pdf" } }), "No disponible")).rejects.toThrow(
    "No disponible",
  );
});

it("preserves business messages and handles plaintext rate limits", async () => {
  await expect(readEnrollmentPdfResponse(Response.json({ message: "El generador está ocupado." }, { status: 503 }), "No disponible")).rejects.toThrow(
    "El generador está ocupado.",
  );
  await expect(readEnrollmentPdfResponse(new Response("Too many requests", { status: 429 }), "No disponible")).rejects.toThrow(
    RATE_LIMIT_ERROR_MESSAGE,
  );
});
