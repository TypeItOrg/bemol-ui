import { roleOptionsResponse } from "@features/people/services/role-options-response.service";
import { PeopleScope } from "@features/people/utils/people-scope.util";

export function GET(request: Request): Promise<Response> {
  return roleOptionsResponse(request, PeopleScope.INSTITUTIONAL);
}
