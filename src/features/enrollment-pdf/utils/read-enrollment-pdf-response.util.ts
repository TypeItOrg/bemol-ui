import { RATE_LIMIT_ERROR_MESSAGE } from "@common/constants/rate-limit.constants";

export async function readEnrollmentPdfResponse(response: Response, fallback: string): Promise<Blob> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(RATE_LIMIT_ERROR_MESSAGE);
    }

    const payload: unknown = await response.json().catch(() => null);

    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;

    throw new Error(typeof message === "string" && message ? message : fallback);
  }

  if (response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/pdf") {
    throw new Error(fallback);
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error(fallback);
  }

  return blob;
}
