import { roleOptionsResponse } from "@features/people/services/role-options-response.service";
import { PeopleScope } from "@features/people/utils/people-scope.util";

const apiFetch = jest.fn();

jest.mock("@features/people/services/people-api-fetch.service", () => ({
  peopleApiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const institution = "019e18e4-d919-76d8-9848-7f1b14e64452";

describe("role option proxy boundaries", () => {
  beforeEach(() => apiFetch.mockReset());

  it("keeps the institutional session even if a caller sends an admin scope", async () => {
    apiFetch.mockResolvedValueOnce(Response.json({ items: [], totalPages: 0 }));
    const request = new Request(`http://localhost/api/institutional/role-options?institutionId=${institution}&scope=admin&search=ZZZ&page=1&size=20`);

    expect((await roleOptionsResponse(request, PeopleScope.INSTITUTIONAL)).status).toBe(200);
    expect(apiFetch).toHaveBeenCalledWith(
      PeopleScope.INSTITUTIONAL,
      `/api/v1/institutions/${institution}/roles?page=1&size=20&search=ZZZ&sort=name%2Casc`,
      { signal: request.signal },
    );
  });

  it.each(["institutionId=invalid", `institutionId=${institution}&size=100`, `institutionId=${institution}&page=-1`])(
    "rejects malformed queries: %s",
    async (query) => {
      const response = await roleOptionsResponse(new Request(`http://localhost/api/admin/role-options?${query}`), PeopleScope.ADMIN);

      expect(response.status).toBe(400);
      expect(apiFetch).not.toHaveBeenCalled();
    },
  );

  it("preserves backend denial responses", async () => {
    apiFetch.mockResolvedValueOnce(Response.json({ message: "Sin acceso" }, { status: 403 }));
    const response = await roleOptionsResponse(
      new Request(`http://localhost/api/admin/role-options?institutionId=${institution}`),
      PeopleScope.ADMIN,
    );

    expect(response.status).toBe(403);
  });
});
