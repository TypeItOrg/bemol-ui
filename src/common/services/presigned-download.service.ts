import "server-only";

import { z } from "zod";

import { httpUrlSchema } from "@common/utils/presigned-upload.util";
import { copyResponseHeaders } from "@common/utils/response-headers.util";

const presignedDownloadSchema = z.object({ url: httpUrlSchema });

const STORAGE_TIMEOUT_MS = 15_000;

/** Fetches the stored file behind a backend `{ url, expiresAt }` download response. */
export async function fetchPresignedDownload(response: Response, signal?: AbortSignal): Promise<Response> {
  const { url } = presignedDownloadSchema.parse(await response.json());

  const timeout = AbortSignal.timeout(STORAGE_TIMEOUT_MS);

  return fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, cache: "no-store" });
}

/** Streams the stored file same-origin so previews need no storage CORS. */
export async function streamPresignedDownload(response: Response, signal?: AbortSignal): Promise<Response> {
  const file = await fetchPresignedDownload(response, signal);

  if (!file.ok || !file.body) {
    await file.body?.cancel();

    throw new Error("Stored file unavailable");
  }

  return new Response(file.body, { status: 200, headers: copyResponseHeaders(file, ["content-type", "content-disposition", "content-length"]) });
}
