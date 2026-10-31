import { headers } from "next/headers";

import { authenticatedApiFetch } from "@common/services/authenticated-api-fetch.service";
import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { getPlatformAccessToken } from "@features/platform-auth/services/get-platform-access-token.service";

export async function GET(request: Request): Promise<Response> {
  const accessToken = await getPlatformAccessToken();

  if (!accessToken) {
    return Response.json({ message: "No autenticado." }, { status: 401 });
  }

  const response = await authenticatedApiFetch(`/api/v1/admin/institutions${new URL(request.url).search}`, accessToken, {}, await headers());

  return createPassthroughResponse(response);
}
