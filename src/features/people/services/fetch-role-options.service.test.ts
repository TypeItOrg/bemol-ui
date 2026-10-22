import { fetchRoleOptions } from "@features/people/services/fetch-role-options.service";
import { PeopleScope } from "@features/people/utils/people-scope.util";

describe("paginated role options", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it.each([PeopleScope.ADMIN, PeopleScope.INSTITUTIONAL])("searches later roles through the %s session", async (scope) => {
    const role = { id: "role-51", name: "ZZZ", technicalCode: null };
    const signal = new AbortController().signal;
    fetchMock.mockResolvedValueOnce(Response.json({ items: [role], page: 1, totalPages: 3 }));

    await expect(fetchRoleOptions("institution", scope, { page: 1, size: 20, search: "ZZZ", signal })).resolves.toEqual({
      items: [role],
      nextPage: 2,
    });
    const session = scope === PeopleScope.ADMIN ? "admin" : "institutional";
    expect(fetchMock).toHaveBeenCalledWith(`/api/${session}/role-options?institutionId=institution&page=1&size=20&search=ZZZ`, {
      signal,
      cache: "no-store",
    });
  });

  it("stops pagination at the last page", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ items: [], page: 2, totalPages: 3 }));

    await expect(
      fetchRoleOptions("institution", PeopleScope.INSTITUTIONAL, { page: 2, size: 20, search: "", signal: new AbortController().signal }),
    ).resolves.toEqual({ items: [], nextPage: null });
  });

  it("propagates authorization failures", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: "Sin permiso" }, { status: 403 }));

    await expect(
      fetchRoleOptions("institution", PeopleScope.INSTITUTIONAL, { page: 0, size: 20, search: "", signal: new AbortController().signal }),
    ).rejects.toThrow("Sin permiso");
  });
});
