import { NextRequest } from "next/server";

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import type { PlatformAccount } from "@features/platform-auth/types/platform-account.types";

const API_URL = "https://api.example.test";
const originalEnvironment = {
  BEMOL_API_URL: process.env.BEMOL_API_URL,
  PLATFORM_PUBLIC_URL: process.env.PLATFORM_PUBLIC_URL,
  FRONTEND_PUBLIC_URL: process.env.FRONTEND_PUBLIC_URL,
  INSTITUTIONAL_BASE_DOMAIN: process.env.INSTITUTIONAL_BASE_DOMAIN,
};
const ACCESS_COOKIE = "platform_access_token";
const REFRESH_COOKIE = "platform_refresh_token";
const credentials = { email: "admin@example.com", password: "secret" };
const account: PlatformAccount = {
  platformAccountId: "platform-account-1",
  email: credentials.email,
  name: "Ada",
  lastName: "Lovelace",
};
const challenge = { loginAttemptId: "11111111-1111-4111-8111-111111111111", setupRequired: false };
const loginTokens = { accessToken: "login-access", refreshToken: "login-refresh" };
const refreshedTokens = { accessToken: "refreshed-access", refreshToken: "refreshed-refresh" };
const cookieValues = new Map<string, string>();
let mockRequestHost = "admin.example.test";
let mockPasskeyRequired = true;
let loginRequests: Request[];
let accountAuthorizations: (string | null)[];
let logoutRequests: Request[];

const server = setupServer(
  http.post(`${API_URL}/api/v1/admin/auth/login`, async ({ request }) => {
    loginRequests.push(request.clone());
    const body = await request.json();

    if (JSON.stringify(body) !== JSON.stringify(credentials)) {
      return HttpResponse.json({ status: 401, message: "Credenciales inválidas" }, { status: 401 });
    }

    return HttpResponse.json(mockPasskeyRequired ? challenge : { account, tokens: loginTokens });
  }),
  http.post(`${API_URL}/api/v1/admin/auth/passkeys/authentication/verify`, () => HttpResponse.json({ account, tokens: loginTokens })),
  http.post(`${API_URL}/api/v1/admin/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };

    if (body.refreshToken !== loginTokens.refreshToken) {
      return HttpResponse.json({ status: 401, message: "Refresh inválido" }, { status: 401 });
    }

    return HttpResponse.json({ tokens: refreshedTokens });
  }),
  http.get(`${API_URL}/api/v1/admin/auth/me`, ({ request }) => {
    const authorization = request.headers.get("authorization");
    accountAuthorizations.push(authorization);
    expect(request.cache).toBe("no-store");

    if (![loginTokens.accessToken, refreshedTokens.accessToken].some((token) => authorization === `Bearer ${token}`)) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ account });
  }),
  http.post(`${API_URL}/api/v1/admin/auth/logout`, ({ request }) => {
    logoutRequests.push(request.clone());

    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  jest.resetModules();
});
afterAll(() => {
  server.close();

  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});
beforeEach(() => {
  process.env.BEMOL_API_URL = API_URL;
  process.env.PLATFORM_PUBLIC_URL = "https://admin.example.test";
  process.env.FRONTEND_PUBLIC_URL = "https://app.example.test";
  process.env.INSTITUTIONAL_BASE_DOMAIN = "example.test";
  cookieValues.clear();
  mockRequestHost = "admin.example.test";
  mockPasskeyRequired = true;
  loginRequests = [];
  accountAuthorizations = [];
  logoutRequests = [];

  jest.doMock("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) => (cookieValues.has(name) ? { name, value: cookieValues.get(name) } : undefined),
      set: (name: string, value: string) => cookieValues.set(name, value),
      delete: (name: string) => cookieValues.delete(name),
    }),
    headers: async () => new Headers({ host: mockRequestHost, "user-agent": "Mozilla/5.0", "x-real-ip": "203.0.113.20" }),
  }));
  jest.doMock("next/navigation", () => ({
    redirect: (url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    },
  }));
});

function loginForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries({ ...credentials, ...overrides })) {
    form.set(key, value);
  }

  return form;
}

function platformRequest(): NextRequest {
  return new NextRequest("https://admin.example.test/", {
    headers: { host: "admin.example.test", cookie: Array.from(cookieValues, ([name, value]) => `${name}=${value}`).join("; ") },
  });
}

describe("platform authentication over HTTP", () => {
  it.each([true, false])(
    "logs in, rotates credentials and logs out without touching institutional cookies (passkeyRequired=%s)",
    async (passkeyRequired) => {
      mockPasskeyRequired = passkeyRequired;
      cookieValues.set("institutional_access_token", "institutional-access");
      const { loginPlatform } = await import("@features/platform-auth/actions/platform-login.action");

      if (passkeyRequired) {
        await expect(loginPlatform({}, loginForm())).resolves.toEqual({ challenge });
        expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
        expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);
        const { finishPlatformPasskey } = await import("@features/platform-auth/actions/platform-passkey.actions");
        await expect(
          finishPlatformPasskey("22222222-2222-4222-8222-222222222222", { id: "fixture-credential" }, false, "/accounts?page=2"),
        ).rejects.toMatchObject({ url: "/accounts?page=2" });
      } else {
        await expect(loginPlatform({}, loginForm({ next: "/accounts?page=2" }))).rejects.toMatchObject({ url: "/accounts?page=2" });
      }

      expect(cookieValues.get(ACCESS_COOKIE)).toBe(loginTokens.accessToken);
      expect(cookieValues.get(REFRESH_COOKIE)).toBe(loginTokens.refreshToken);
      expect(loginRequests).toHaveLength(1);
      expect(await loginRequests[0].json()).toEqual(credentials);
      expect(loginRequests[0].cache).toBe("no-store");
      expect(loginRequests[0].headers.get("user-agent")).toBe("Mozilla/5.0");
      expect(loginRequests[0].headers.get("x-forwarded-for")).toBe("203.0.113.20");
      expect(loginRequests[0].headers.get("x-real-ip")).toBe("203.0.113.20");

      const { getPlatformAccount } = await import("@features/platform-auth/services/get-platform-account.service");
      await expect(getPlatformAccount()).resolves.toEqual(account);
      expect(accountAuthorizations).toEqual([`Bearer ${loginTokens.accessToken}`]);

      cookieValues.delete(ACCESS_COOKIE);
      const { proxy } = await import("../../src/proxy");
      const response = await proxy(platformRequest());
      expect(response.headers.get("x-middleware-rewrite")).toBe("https://admin.example.test/admin");
      expect(response.headers.get("x-middleware-request-cookie")).toContain(`${ACCESS_COOKIE}=${refreshedTokens.accessToken}`);
      expect(response.headers.get("x-middleware-request-cookie")).toContain(`${REFRESH_COOKIE}=${refreshedTokens.refreshToken}`);

      for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
        cookieValues.set(name, response.cookies.get(name)!.value);
      }

      expect(cookieValues.get(ACCESS_COOKIE)).toBe(refreshedTokens.accessToken);
      expect(cookieValues.get(REFRESH_COOKIE)).toBe(refreshedTokens.refreshToken);
      await expect(getPlatformAccount()).resolves.toEqual(account);
      expect(accountAuthorizations.at(-1)).toBe(`Bearer ${refreshedTokens.accessToken}`);

      const { logoutPlatform } = await import("@features/platform-auth/actions/platform-logout.action");
      await expect(logoutPlatform()).rejects.toMatchObject({ url: "/auth/login" });
      expect(logoutRequests).toHaveLength(1);
      expect(logoutRequests[0].method).toBe("POST");
      expect(logoutRequests[0].headers.get("X-Institutional-Host")).toBe("admin.example.test");
      expect(logoutRequests[0].headers.get("authorization")).toBe(`Bearer ${refreshedTokens.accessToken}`);
      expect(logoutRequests[0].cache).toBe("no-store");
      expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
      expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);
      expect(cookieValues.get("institutional_access_token")).toBe("institutional-access");
    },
  );

  it("rejects invalid fields before HTTP and never installs credentials after backend validation or authentication errors", async () => {
    const { loginPlatform } = await import("@features/platform-auth/actions/platform-login.action");
    expect(await loginPlatform({}, new FormData())).toMatchObject({ fieldErrors: { email: expect.any(String), password: expect.any(String) } });
    expect(loginRequests).toHaveLength(0);

    server.use(
      http.post(`${API_URL}/api/v1/admin/auth/login`, () =>
        HttpResponse.json(
          {
            status: 400,
            message: "Validation error",
            fieldErrors: { email: "Correo inválido", password: "Contraseña inválida", ignored: "ignored" },
          },
          { status: 400 },
        ),
      ),
    );
    await expect(loginPlatform({}, loginForm())).resolves.toEqual({ fieldErrors: { email: "Correo inválido", password: "Contraseña inválida" } });

    server.resetHandlers();
    await expect(loginPlatform({}, loginForm({ password: "wrong" }))).resolves.toEqual({ error: "Credenciales inválidas" });
    expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
    expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);
  });

  it.each([false, true])(
    "does not borrow an institutional access token when platform credentials are missing (institutional=%s)",
    async (hasInstitutional) => {
      if (hasInstitutional) {
        cookieValues.set("institutional_access_token", "institutional-access");
      }

      const { getPlatformAccount } = await import("@features/platform-auth/services/get-platform-account.service");
      await expect(getPlatformAccount()).resolves.toBeNull();
      expect(accountAuthorizations).toHaveLength(0);
    },
  );

  it("rejects a platform cookie on the wrong host before making an account request", async () => {
    mockRequestHost = "app.example.test";
    cookieValues.set(ACCESS_COOKIE, loginTokens.accessToken);

    const { getPlatformAccount } = await import("@features/platform-auth/services/get-platform-account.service");

    await expect(getPlatformAccount()).rejects.toMatchObject({ url: "/auth/login" });
    expect(accountAuthorizations).toHaveLength(0);
  });

  it.each(["unauthorized", "unavailable", "malformed", "network"] as const)(
    "distinguishes %s account responses from a valid session",
    async (failure) => {
      cookieValues.set(ACCESS_COOKIE, loginTokens.accessToken);
      server.use(
        http.get(`${API_URL}/api/v1/admin/auth/me`, () => {
          if (failure === "network") {
            return HttpResponse.error();
          }

          if (failure === "malformed") {
            return HttpResponse.json({ account: { platformAccountId: "incomplete" } });
          }

          return HttpResponse.json({ message: failure }, { status: failure === "unauthorized" ? 401 : 503 });
        }),
      );
      const { getPlatformAccount } = await import("@features/platform-auth/services/get-platform-account.service");

      if (failure === "unauthorized") {
        await expect(getPlatformAccount()).resolves.toBeNull();
      } else {
        await expect(getPlatformAccount()).rejects.toThrow();
      }

      expect(cookieValues.get(ACCESS_COOKIE)).toBe(loginTokens.accessToken);
    },
  );

  it("clears the response credentials only after a definitive refresh rejection", async () => {
    cookieValues.set(REFRESH_COOKIE, "invalid-refresh");
    const { proxy } = await import("../../src/proxy");
    const response = await proxy(platformRequest());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://admin.example.test/auth/login?next=%2F");
    expect(response.cookies.get(ACCESS_COOKIE)?.value).toBe("");
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe("");
  });

  it("does not send remote logout without a platform token", async () => {
    cookieValues.set("institutional_access_token", "institutional-access");
    const { logoutPlatformAccount } = await import("@features/platform-auth/services/logout-platform-account.service");
    await expect(logoutPlatformAccount()).resolves.toBeUndefined();
    expect(logoutRequests).toHaveLength(0);
    expect(cookieValues.get("institutional_access_token")).toBe("institutional-access");
  });

  it("clears local credentials when remote logout is unavailable", async () => {
    cookieValues.set(ACCESS_COOKIE, loginTokens.accessToken);
    cookieValues.set(REFRESH_COOKIE, loginTokens.refreshToken);
    server.use(http.post(`${API_URL}/api/v1/admin/auth/logout`, () => HttpResponse.error()));
    const { logoutPlatformAccount } = await import("@features/platform-auth/services/logout-platform-account.service");
    await expect(logoutPlatformAccount()).resolves.toBeUndefined();
    expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
    expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);
  });
});
