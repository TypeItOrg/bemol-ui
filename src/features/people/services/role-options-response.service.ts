import { z } from "zod";

import { createPassthroughResponse } from "@common/utils/create-passthrough-response.util";

import { ROLE_OPTIONS_MESSAGES as M } from "@features/people/constants/role-options.constants";
import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";
import { PeopleScope, type PeopleScope as PeopleScopeType } from "@features/people/utils/people-scope.util";

const querySchema = z.object({
  institutionId: z.uuid(),
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(20),
});

export async function roleOptionsResponse(request: Request, scope: PeopleScopeType): Promise<Response> {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));

  if (!parsed.success) {
    return Response.json({ message: M.INVALID_QUERY }, { status: 400 });
  }

  const { institutionId, page, size, search } = parsed.data;

  const params = new URLSearchParams({ page: String(page), size: String(size), search, sort: "name,asc" });

  const path = PeopleScope.isInstitutional(scope)
    ? `/api/v1/institutions/${institutionId}/roles`
    : `/api/v1/admin/institutions/${institutionId}/role-options`;

  try {
    return createPassthroughResponse(await peopleApiFetch(scope, `${path}?${params}`, { signal: request.signal }));
  } catch {
    return Response.json({ message: M.LOAD_ERROR }, { status: 503 });
  }
}
