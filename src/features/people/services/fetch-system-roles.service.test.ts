import type { AssignableRole } from "@features/people/types/assignable-role.types";
import { PeopleScope } from "@features/people/utils/people-scope.util";

const ASSIGNABLE_ROLES: AssignableRole[] = [{ id: "role-1", name: "Docente", technicalCode: "TEACHER" }];

describe("fetchSystemRoles", () => {
  type ServiceModule = typeof import("@features/people/services/fetch-system-roles.service");

  const peopleApiFetchMock = jest.fn<Promise<Response>, [PeopleScope, string]>();

  async function importService(): Promise<ServiceModule> {
    jest.doMock("@features/people/services/people-api-fetch.service", () => ({
      peopleApiFetch: peopleApiFetchMock,
    }));

    return import("@features/people/services/fetch-system-roles.service");
  }

  beforeEach(() => {
    jest.resetModules();
    peopleApiFetchMock.mockReset();
  });

  it("extracts roles from the institutional paginated response", async () => {
    peopleApiFetchMock.mockResolvedValue(Response.json({ items: ASSIGNABLE_ROLES, page: 0, size: 50, totalItems: 1, totalPages: 1 }));
    const { fetchSystemRoles } = await importService();

    await expect(fetchSystemRoles("institution-1", PeopleScope.INSTITUTIONAL)).resolves.toEqual(ASSIGNABLE_ROLES);
    expect(peopleApiFetchMock).toHaveBeenCalledWith(PeopleScope.INSTITUTIONAL, "/api/v1/institutions/institution-1/roles?size=50");
  });

  it("uses paginated platform options instead of loading every role", async () => {
    peopleApiFetchMock.mockResolvedValue(Response.json({ items: ASSIGNABLE_ROLES, page: 0, size: 50, totalItems: 51, totalPages: 2 }));
    const { fetchSystemRoles } = await importService();

    await expect(fetchSystemRoles("institution-1", PeopleScope.ADMIN)).resolves.toEqual(ASSIGNABLE_ROLES);
    expect(peopleApiFetchMock).toHaveBeenCalledWith(PeopleScope.ADMIN, "/api/v1/admin/institutions/institution-1/role-options?size=50");
    expect(peopleApiFetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([PeopleScope.INSTITUTIONAL, PeopleScope.ADMIN])("retains metadata for assigned roles outside the first page in %s", async (scope) => {
    const missing: AssignableRole = {
      id: "role-51",
      name: "Rol fuera de la primera página",
      technicalCode: null,
      supportsTrainingPathScope: true,
      inactivePermissionDescriptionsWhenScoped: ["Ver usuarios"],
    };
    peopleApiFetchMock
      .mockResolvedValueOnce(Response.json({ items: ASSIGNABLE_ROLES, page: 0, size: 50, totalItems: 51, totalPages: 2 }))
      .mockResolvedValueOnce(Response.json(missing));
    const { fetchSystemRoles } = await importService();

    await expect(fetchSystemRoles("institution-1", scope, ["role-1", "role-51", "role-51"])).resolves.toEqual([...ASSIGNABLE_ROLES, missing]);
    const prefix = scope === PeopleScope.ADMIN ? "/admin" : "";
    expect(peopleApiFetchMock).toHaveBeenLastCalledWith(scope, `/api/v1${prefix}/institutions/institution-1/role-options/role-51`);
    expect(peopleApiFetchMock).toHaveBeenCalledTimes(2);
  });
});
