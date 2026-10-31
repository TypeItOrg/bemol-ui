import { headers } from "next/headers";

import { loginPlatform } from "@features/platform-auth/actions/platform-login.action";
import { loginPlatformAccount } from "@features/platform-auth/services/login-platform-account.service";
import { setPlatformAuthCookies } from "@features/platform-auth/utils/platform-auth-cookies.util";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  },
}));
jest.mock("@features/platform-auth/services/login-platform-account.service", () => ({ loginPlatformAccount: jest.fn() }));
jest.mock("@features/platform-auth/utils/platform-auth-cookies.util", () => ({ setPlatformAuthCookies: jest.fn() }));

const originalPlatformUrl = process.env.PLATFORM_PUBLIC_URL;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.PLATFORM_PUBLIC_URL = "http://admin.localhost:3000";
  jest.mocked(headers).mockResolvedValue(new Headers({ host: "admin.localhost:3000" }));
});

afterAll(() => {
  if (originalPlatformUrl === undefined) {
    delete process.env.PLATFORM_PUBLIC_URL;
  } else {
    process.env.PLATFORM_PUBLIC_URL = originalPlatformUrl;
  }
});

function loginForm(next = ""): FormData {
  const data = new FormData();
  data.set("email", "admin@example.test");
  data.set("password", "valid-password");
  data.set("next", next);

  return data;
}

it("returns the second-factor challenge without creating session cookies", async () => {
  const challenge = { loginAttemptId: "11111111-1111-4111-8111-111111111111", setupRequired: true };

  jest.mocked(loginPlatformAccount).mockResolvedValue({ success: true, data: challenge });

  expect(await loginPlatform({}, loginForm())).toEqual({ challenge });
  expect(setPlatformAuthCookies).not.toHaveBeenCalled();
});

it.each([
  ["/institutions?page=2", "/institutions?page=2"],
  ["https://evil.example/", "/"],
  ["//evil.example/", "/"],
])("installs password-only session cookies and safely redirects %s", async (next, destination) => {
  const result = {
    account: { platformAccountId: "platform-account", email: "admin@example.test", name: "Ada", lastName: "Lovelace" },
    tokens: { accessToken: "access", refreshToken: "refresh" },
  };
  jest.mocked(loginPlatformAccount).mockResolvedValue({ success: true, data: result });

  await expect(loginPlatform({}, loginForm(next))).rejects.toMatchObject({ url: destination });
  expect(setPlatformAuthCookies).toHaveBeenCalledWith(result.tokens);
});

it("rejects a wrong host before requesting a password-only session", async () => {
  jest.mocked(headers).mockResolvedValue(new Headers({ host: "school.localhost:3000" }));

  await expect(loginPlatform({}, loginForm())).rejects.toMatchObject({ url: "/auth/login" });
  expect(loginPlatformAccount).not.toHaveBeenCalled();
  expect(setPlatformAuthCookies).not.toHaveBeenCalled();
});
