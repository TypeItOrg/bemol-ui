import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { INSTITUTIONAL_AUTH_ERROR_MESSAGES } from "@features/institutional-auth/constants/error-messages.constants";

const API_URL = "https://api.example.test";
const institutionId = "22222222-2222-4222-8222-222222222222";
const identity = { institutionId, documentNumber: "12345678" };
const tokens = { accessToken: "institutional-access", refreshToken: "institutional-refresh" };
const user = { ...identity, userId: "user-1", personId: "person-1", name: "Ana", lastName: "García", roles: ["Estudiante"], permissions: [] };
const ACCESS_COOKIE = "institutional_access_token";
const REFRESH_COOKIE = "institutional_refresh_token";
const originalEnvironment = {
  BEMOL_API_URL: process.env.BEMOL_API_URL,
  FRONTEND_PUBLIC_URL: process.env.FRONTEND_PUBLIC_URL,
  INSTITUTIONAL_BASE_DOMAIN: process.env.INSTITUTIONAL_BASE_DOMAIN,
};
const cookieValues = new Map<string, string>();
const cookieMaxAges = new Map<string, number>();
let requestHost: string;
let requests: Request[];

const server = setupServer(
  http.post(`${API_URL}/api/v1/auth/login/identify`, async ({ request }) => {
    requests.push(request.clone());
    expect(await request.json()).toEqual(identity);

    return HttpResponse.json({ loginAttemptId: "attempt-1", nextStep: "PASSKEY" });
  }),
  http.post(`${API_URL}/api/v1/auth/login/password`, async ({ request }) => {
    requests.push(request.clone());
    const body = (await request.json()) as { password: string; loginAttemptId: string; rememberMe: boolean };
    expect(body.loginAttemptId).toBe("attempt-1");

    if (body.password !== "correct-password") {
      return HttpResponse.json({ status: 401, message: "Documento o contraseña incorrectos." }, { status: 401 });
    }

    return HttpResponse.json({ user, tokens });
  }),
  http.get(`${API_URL}/api/v1/auth/me`, ({ request }) => {
    requests.push(request.clone());
    expect(request.headers.get("authorization")).toBe(`Bearer ${tokens.accessToken}`);
    expect(request.cache).toBe("no-store");

    return HttpResponse.json({ user });
  }),
  http.post(`${API_URL}/api/v1/auth/logout`, ({ request }) => {
    requests.push(request.clone());

    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API_URL}/api/v1/institutions/by-subdomain/conservatorio`, () =>
    HttpResponse.json({ id: institutionId, name: "Conservatorio", publicSubdomain: "conservatorio", logoUrl: null }),
  ),
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
  process.env.FRONTEND_PUBLIC_URL = "https://app.example.test";
  process.env.INSTITUTIONAL_BASE_DOMAIN = "example.test";
  requestHost = "app.example.test";
  requests = [];
  cookieValues.clear();
  cookieMaxAges.clear();

  jest.doMock("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) => (cookieValues.has(name) ? { name, value: cookieValues.get(name) } : undefined),
      set: (name: string, value: string, options: { maxAge: number }) => {
        cookieValues.set(name, value);
        cookieMaxAges.set(name, options.maxAge);
      },
      delete: (name: string) => cookieValues.delete(name),
    }),
    headers: async () => new Headers({ host: requestHost, "user-agent": "Mozilla/5.0", "x-real-ip": "203.0.113.20" }),
  }));
  jest.doMock("next/navigation", () => ({
    redirect: (url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    },
  }));
});

function credentialsForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries({ ...identity, password: "correct-password", ...overrides })) {
    form.set(key, value);
  }

  return form;
}

describe("institutional authentication over HTTP", () => {
  it.each([false, true])(
    "recovers from a rejected password, honors explicit password choice despite PASSKEY preference and loads the session (rememberMe=%s)",
    async (rememberMe) => {
      const { institutionalCredentialsLogin } = await import("@features/institutional-auth/actions/institutional-credentials-login.action");
      await expect(institutionalCredentialsLogin({}, credentialsForm({ password: "wrong-password" }))).resolves.toEqual({
        error: "Documento o contraseña incorrectos.",
      });
      expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
      expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);

      await expect(institutionalCredentialsLogin({}, credentialsForm(rememberMe ? { rememberMe: "on" } : {}))).rejects.toMatchObject({ url: "/" });
      expect(cookieValues.get(ACCESS_COOKIE)).toBe(tokens.accessToken);
      expect(cookieValues.get(REFRESH_COOKIE)).toBe(tokens.refreshToken);
      expect(cookieMaxAges.get(REFRESH_COOKIE)).toBe(rememberMe ? 2592000 : 604800);
      expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
        "/api/v1/auth/login/identify",
        "/api/v1/auth/login/password",
        "/api/v1/auth/login/identify",
        "/api/v1/auth/login/password",
      ]);
      expect(await requests[3].json()).toEqual({ loginAttemptId: "attempt-1", password: "correct-password", rememberMe });
      expect(requests[3].headers.get("x-institutional-host")).toBe("app.example.test");
      expect(requests[3].headers.get("user-agent")).toBe("Mozilla/5.0");
      expect(requests[3].headers.get("x-real-ip")).toBe("203.0.113.20");

      const { getInstitutionalUser } = await import("@features/institutional-auth/services/get-institutional-user.service");
      await expect(getInstitutionalUser()).resolves.toEqual(user);
    },
  );

  it.each([
    ["documentNumber", "abc"],
    ["password", ""],
    ["rememberMe", "false"],
  ])("rejects invalid %s before any authentication HTTP request", async (field, value) => {
    const { institutionalCredentialsLogin } = await import("@features/institutional-auth/actions/institutional-credentials-login.action");
    const result = await institutionalCredentialsLogin({}, credentialsForm({ [field]: value }));
    expect(result).toEqual(expect.objectContaining(field === "rememberMe" ? { error: expect.any(String) } : { fieldErrors: expect.any(Object) }));
    expect(requests).toHaveLength(0);
    expect(cookieValues.size).toBe(0);
  });

  it("reports unknown accounts without attempting password login", async () => {
    server.use(http.post(`${API_URL}/api/v1/auth/login/identify`, () => HttpResponse.json({ status: 404, message: "not found" }, { status: 404 })));
    const { institutionalCredentialsLogin } = await import("@features/institutional-auth/actions/institutional-credentials-login.action");
    await expect(institutionalCredentialsLogin({}, credentialsForm())).resolves.toEqual({
      error: INSTITUTIONAL_AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
    });
    expect(requests).toHaveLength(0);
    expect(cookieValues.size).toBe(0);
  });

  it("keeps pending verification identity in a cookie, never in the redirect URL or authentication cookies", async () => {
    server.use(http.post(`${API_URL}/api/v1/auth/login/identify`, () => HttpResponse.json({ nextStep: "EMAIL_VERIFICATION", loginAttemptId: null })));
    const { institutionalCredentialsLogin } = await import("@features/institutional-auth/actions/institutional-credentials-login.action");
    await expect(institutionalCredentialsLogin({}, credentialsForm())).rejects.toMatchObject({ url: "/auth/email-verification" });
    expect(JSON.parse(cookieValues.get("institutional_email_verification_context")!)).toEqual(identity);
    expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
    expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);
    expect(requests).toHaveLength(0);
  });

  it("resolves the branded host and rejects a tampered institution before identification or password transport", async () => {
    requestHost = "conservatorio.example.test";
    const { institutionalCredentialsLogin } = await import("@features/institutional-auth/actions/institutional-credentials-login.action");
    await expect(institutionalCredentialsLogin({}, credentialsForm({ institutionId: "33333333-3333-4333-8333-333333333333" }))).resolves.toEqual({
      error: "La institución no corresponde a este acceso.",
    });
    expect(requests).toHaveLength(0);
    expect(cookieValues.size).toBe(0);
  });

  it("does not borrow a platform token when there is no institutional access token", async () => {
    cookieValues.set("platform_access_token", "platform-only");
    const { getInstitutionalUser } = await import("@features/institutional-auth/services/get-institutional-user.service");
    await expect(getInstitutionalUser()).resolves.toBeNull();
    expect(requests).toHaveLength(0);
  });

  it.each(["unauthorized", "network"])("distinguishes %s session failure without clearing credentials", async (failure) => {
    cookieValues.set(ACCESS_COOKIE, tokens.accessToken);
    server.use(http.get(`${API_URL}/api/v1/auth/me`, () => (failure === "network" ? HttpResponse.error() : new HttpResponse(null, { status: 401 }))));
    const { getInstitutionalUser } = await import("@features/institutional-auth/services/get-institutional-user.service");

    if (failure === "unauthorized") {
      await expect(getInstitutionalUser()).resolves.toBeNull();
    } else {
      await expect(getInstitutionalUser()).rejects.toThrow();
    }

    expect(cookieValues.get(ACCESS_COOKIE)).toBe(tokens.accessToken);
  });

  it.each(["success", "network", "missing"])(
    "clears local credentials and redirects on logout even when the remote session is %s",
    async (remote) => {
      cookieValues.set("platform_access_token", "platform-only");
      cookieValues.set(REFRESH_COOKIE, tokens.refreshToken);

      if (remote !== "missing") {
        cookieValues.set(ACCESS_COOKIE, tokens.accessToken);
      }

      if (remote === "network") {
        server.use(http.post(`${API_URL}/api/v1/auth/logout`, () => HttpResponse.error()));
      }

      const { logoutInstitutional } = await import("@features/institutional-auth/actions/institutional-logout.action");
      await expect(logoutInstitutional()).rejects.toMatchObject({ url: "/auth/login" });
      expect(cookieValues.has(ACCESS_COOKIE)).toBe(false);
      expect(cookieValues.has(REFRESH_COOKIE)).toBe(false);
      expect(cookieValues.get("platform_access_token")).toBe("platform-only");
      expect(requests).toHaveLength(remote === "success" ? 1 : 0);

      if (remote === "success") {
        expect(requests[0].method).toBe("POST");
        expect(requests[0].headers.get("authorization")).toBe(`Bearer ${tokens.accessToken}`);
        expect(requests[0].cache).toBe("no-store");
      }
    },
  );
});
