import { manageAccountAccess } from "@features/people/actions/manage-account-access.action";
import { peopleApiFetch } from "@features/people/services/people-api-fetch.service";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@features/people/services/people-api-fetch.service", () => ({ peopleApiFetch: jest.fn() }));
jest.mock("@features/platform-auth/services/get-platform-account.service", () => ({ requirePlatformAccount: jest.fn() }));
jest.mock("@features/institutional-auth/services/get-institutional-user.service", () => ({
  requireInstitutionalUser: jest.fn(async () => ({ institutionId: "00000000-0000-4000-8000-000000000001" })),
}));
const institution = "00000000-0000-4000-8000-000000000001";
const person = "00000000-0000-4000-8000-000000000002";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));

  return data;
}

beforeEach(() =>
  jest
    .mocked(peopleApiFetch)
    .mockReset()
    .mockResolvedValue(new Response(null, { status: 204 })),
);

it("rejects unknown operations and malformed bound identifiers without writing", async () => {
  expect(await manageAccountAccess("institutional", institution, person, {}, form({ operation: "false" }))).toHaveProperty("error");
  expect(await manageAccountAccess("admin", "invalid", person, {}, form({ operation: "enable" }))).toHaveProperty("error");
  expect(peopleApiFetch).not.toHaveBeenCalled();
});
it("uses the real actor's reauthentication password, never an operator-defined target password", async () => {
  expect(
    await manageAccountAccess(
      "admin",
      institution,
      person,
      {},
      form({ operation: "recover", currentPassword: "actor-password", password: "target-password" }),
    ),
  ).toEqual({ success: true });
  const [, path, init] = jest.mocked(peopleApiFetch).mock.calls[0];
  expect(path).toBe(`/api/v1/admin/institutions/${institution}/people/${person}/password-recovery`);
  expect(JSON.parse(String(init?.body))).toEqual({ currentPassword: "actor-password" });
});
it("requires explicit autonomy confirmation and reauthentication", async () => {
  expect(
    await manageAccountAccess(
      "admin",
      institution,
      person,
      {},
      form({ operation: "autonomy", email: "shared@example.test", currentPassword: "actor-password" }),
    ),
  ).toHaveProperty("error");
  expect(peopleApiFetch).not.toHaveBeenCalled();
});
it("sends an explicit boolean to suspend without changing institutional status", async () => {
  await manageAccountAccess("institutional", institution, person, {}, form({ operation: "suspend" }));
  const [, path, init] = jest.mocked(peopleApiFetch).mock.calls[0];
  expect(path).toBe(`/api/v1/institutions/${institution}/people/${person}/own-access`);
  expect(JSON.parse(String(init?.body))).toEqual({ enabled: false });
});
it("accepts a shared mailbox for invitations without a password", async () => {
  await manageAccountAccess("admin", institution, person, {}, form({ operation: "invite", email: "shared@example.test" }));
  const [, , init] = jest.mocked(peopleApiFetch).mock.calls[0];
  expect(JSON.parse(String(init?.body))).toEqual({ email: "shared@example.test" });
});
