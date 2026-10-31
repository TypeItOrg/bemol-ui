import { headers } from "next/headers";

import { getPlatformAccessToken } from "@features/platform-auth/services/get-platform-access-token.service";
import { getPlatformAccount } from "@features/platform-auth/services/get-platform-account.service";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("@features/platform-auth/services/get-platform-access-token.service", () => ({ getPlatformAccessToken: jest.fn() }));

const fetchMock = jest.fn();
const originalEnvironment = { ...process.env };

beforeEach(() => {
  process.env.BEMOL_API_URL = "http://backend.test";
  process.env.PLATFORM_PUBLIC_URL = "http://admin.localhost:3000";
  process.env.INSTITUTIONAL_BASE_DOMAIN = "";
  jest.mocked(headers).mockResolvedValue(new Headers({ host: "admin.localhost:3000", "X-Institutional-Host": "forged.test" }));
  jest.mocked(getPlatformAccessToken).mockResolvedValue("opaque-token");
  global.fetch = fetchMock;
});

afterAll(() => {
  process.env = originalEnvironment;
});

it("validates the session with the canonical platform host through the shared transport", async () => {
  const account = { platformAccountId: "account-id", email: "qa@example.test", name: "QA", lastName: "Admin" };

  fetchMock.mockResolvedValue(Response.json({ account }));

  expect(await getPlatformAccount()).toEqual(account);

  const [url, init] = fetchMock.mock.calls.at(-1);

  expect(url).toEqual(new URL("http://backend.test/api/v1/admin/auth/me"));
  expect(init.headers.get("Authorization")).toBe("Bearer opaque-token");
  expect(init.headers.get("X-Institutional-Host")).toBe("admin.localhost:3000");
  expect(init.cache).toBe("no-store");
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

it("treats a revoked session as unauthenticated", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

  expect(await getPlatformAccount()).toBeNull();
});

it("does not query the backend without a session", async () => {
  jest.mocked(getPlatformAccessToken).mockResolvedValue(undefined);

  expect(await getPlatformAccount()).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});
