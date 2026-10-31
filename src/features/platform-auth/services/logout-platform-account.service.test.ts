import { headers } from "next/headers";

import { getPlatformAccessToken } from "@features/platform-auth/services/get-platform-access-token.service";
import { logoutPlatformAccount } from "@features/platform-auth/services/logout-platform-account.service";
import { clearPlatformAuthCookies } from "@features/platform-auth/utils/platform-auth-cookies.util";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("@features/platform-auth/services/get-platform-access-token.service", () => ({ getPlatformAccessToken: jest.fn() }));
jest.mock("@features/platform-auth/utils/platform-auth-cookies.util", () => ({ clearPlatformAuthCookies: jest.fn() }));

const fetchMock = jest.fn();
const original = { ...process.env };

beforeEach(() => {
  process.env.PLATFORM_PUBLIC_URL = "http://admin.localhost:3000";
  process.env.BEMOL_API_URL = "http://backend.test";
  jest.mocked(headers).mockResolvedValue(new Headers({ host: "admin.localhost:3000" }));
  jest.mocked(getPlatformAccessToken).mockResolvedValue("opaque-token");
  global.fetch = fetchMock;
});

afterAll(() => {
  process.env = original;
});

it("binds logout to the platform host so the backend can revoke the session", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

  await logoutPlatformAccount();

  const [url, init] = fetchMock.mock.calls.at(-1);

  expect(url).toEqual(new URL("http://backend.test/api/v1/admin/auth/logout"));
  expect(init.headers.get("X-Institutional-Host")).toBe("admin.localhost:3000");
  expect(init.headers.get("Authorization")).toBe("Bearer opaque-token");
  expect(init.method).toBe("POST");
});

it("preserves cookie cleanup when logout cannot reach the backend", async () => {
  fetchMock.mockRejectedValue(new Error("Connection unavailable"));

  await logoutPlatformAccount();

  expect(clearPlatformAuthCookies).toHaveBeenCalled();
});
