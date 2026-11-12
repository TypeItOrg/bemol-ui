import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";

import { enrollmentPdfDataSchema } from "@features/enrollment-pdf/schemas/enrollment-pdf-data.schema";
import { renderEnrollmentPdf } from "@features/enrollment-pdf/utils/render-enrollment-pdf.util";

export async function readEnrollmentPdfResponse(response: Response, fallback: string): Promise<Blob> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(RATE_LIMIT_ERROR_MESSAGE);
    }

    const payload: unknown = await response.json().catch(() => null);

    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;

    throw new Error(typeof message === "string" && message ? message : fallback);
  }

  if (response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new Error(fallback);
  }

  const parsed = enrollmentPdfDataSchema.safeParse(await response.json().catch(() => null));

  if (!parsed.success) {
    throw new Error(fallback);
  }

  try {
    const blob = await renderEnrollmentPdf(parsed.data);

    if (!blob.size) {
      throw new Error(fallback);
    }

    return blob;
  } catch {
    throw new Error(fallback);
  }
}
