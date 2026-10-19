import { NextRequest } from "next/server";

import { tryStagingAutoLogin } from "@features/institutional-auth/services/staging-auto-login.service";
import {
  INSTITUTIONAL_ACCESS_TOKEN_COOKIE,
  INSTITUTIONAL_REFRESH_TOKEN_COOKIE,
} from "@features/institutional-auth/utils/institutional-auth-cookies.util";

import { proxy } from "@/proxy";

describe("staging automatic login", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

  function request(path = "/", headers: Record<string, string> = {}): NextRequest {
    return new NextRequest(`https://staging.example.test${path}`, {
      headers: { host: "staging.example.test", ...headers },
    });
  }

  beforeEach(() => {
    process.env.DEPLOYMENT_ENV = "staging";
    process.env.AUTO_LOGIN_ENABLED = "true";
    process.env.FRONTEND_PUBLIC_URL = "https://staging.example.test";
    process.env.INSTITUTIONAL_BASE_DOMAIN = "staging.example.test";
    process.env.BOERO_API_URL = "http://api:8080";
    process.env.AUTH_COOKIE_SECURE = "true";
    global.fetch = fetchMock;
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("silently logs in from the root proxy using secure, host-only session cookies", async () => {
    fetchMock.mockResolvedValue(Response.json({ tokens: { accessToken: "access", refreshToken: "refresh" } }));
    const response = await proxy(request());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://staging.example.test/");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.cookies.get(INSTITUTIONAL_ACCESS_TOKEN_COOKIE)).toMatchObject({
      value: "access",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
    expect(response.cookies.get(INSTITUTIONAL_REFRESH_TOKEN_COOKIE)?.value).toBe("refresh");
    expect(response.cookies.get(INSTITUTIONAL_ACCESS_TOKEN_COOKIE)?.domain).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://api:8080/api/v1/auth/login/staging");
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(new Headers(init?.headers).get("X-Institutional-Host")).toBe("staging.example.test");
  });

  it("remains disabled when the flag is off", async () => {
    process.env.AUTO_LOGIN_ENABLED = "false";
    expect(await tryStagingAutoLogin(request())).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses production even with the flag enabled", async () => {
    process.env.DEPLOYMENT_ENV = "production";
    expect(await tryStagingAutoLogin(request())).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not replace an existing session", async () => {
    expect(await tryStagingAutoLogin(request("/", { cookie: `${INSTITUTIONAL_REFRESH_TOKEN_COOKIE}=existing` }))).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("leaves the normal login and prefetch navigation untouched", async () => {
    expect(await tryStagingAutoLogin(request("/auth/login"))).toBeUndefined();
    expect(await tryStagingAutoLogin(request("/", { "next-router-prefetch": "1" }))).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a different public host", async () => {
    expect(await tryStagingAutoLogin(request("/", { host: "other.example.test" }))).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the normal login when the backend is unavailable", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
    const response = await proxy(request());
    expect(response.headers.get("location")).toBe("https://staging.example.test/auth/login");
    expect(response.cookies.get(INSTITUTIONAL_ACCESS_TOKEN_COOKIE)).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not set cookies for an incomplete token response", async () => {
    fetchMock.mockResolvedValue(Response.json({ tokens: { accessToken: "access" } }));
    expect(await tryStagingAutoLogin(request())).toBeUndefined();
  });
});
