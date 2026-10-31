import { NextRequest } from "next/server";

import { PLATFORM_ACCESS_TOKEN_COOKIE } from "@features/platform-auth/utils/platform-auth-cookies.util";

import { proxy } from "@/proxy";

const fetchMock = jest.fn();
const original = { ...process.env };

beforeEach(() => {
  process.env.FRONTEND_PUBLIC_URL = "https://staging.bemol.com.ar";
  process.env.PLATFORM_PUBLIC_URL = "https://admin.staging.bemol.com.ar";
  process.env.INSTITUTIONAL_BASE_DOMAIN = "staging.bemol.com.ar";
  process.env.BEMOL_API_URL = "http://backend.test";
  global.fetch = fetchMock;
  fetchMock.mockReset();
});

afterAll(() => {
  process.env = original;
});

function request(host: string, path: string, method = "GET", authenticated = false): NextRequest {
  return new NextRequest(`https://${host}${path}`, {
    method,
    headers: { host, ...(authenticated ? { cookie: `${PLATFORM_ACCESS_TOKEN_COOKIE}=opaque-token` } : {}) },
  });
}

it("renders administrative login at the clean URL without querying an institution", async () => {
  const response = await proxy(request("admin.staging.bemol.com.ar", "/auth/login"));

  expect(response.headers.get("x-middleware-rewrite")).toBe("https://admin.staging.bemol.com.ar/admin/auth/login");
  expect(response.headers.get("location")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  ["/", "/admin"],
  ["/account/passkeys", "/admin/account/passkeys"],
  ["/institutions?page=2", "/admin/institutions?page=2"],
])("renders a protected platform page without exposing its internal prefix: %s", async (visible, internal) => {
  const response = await proxy(request("admin.staging.bemol.com.ar", visible, "GET", true));

  expect(response.headers.get("x-middleware-rewrite")).toBe(`https://admin.staging.bemol.com.ar${internal}`);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("x-middleware-request-x-institutional-host")).toBe("admin.staging.bemol.com.ar");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("requires the platform session at the hostname root", async () => {
  const response = await proxy(request("admin.staging.bemol.com.ar", "/"));

  expect(response.headers.get("location")).toBe("https://admin.staging.bemol.com.ar/auth/login?next=%2F");
  expect(response.headers.has("x-middleware-rewrite")).toBe(false);
});

it.each(["staging.bemol.com.ar", "admin.staging.bemol.com.ar"])("redirects legacy page URLs on %s without executing their actions", async (host) => {
  const response = await proxy(request(host, "/admin/auth/login?next=%2Fadmin"));

  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://admin.staging.bemol.com.ar/auth/login?next=%2Fadmin");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not interpret a legacy path as a different redirect authority", async () => {
  const response = await proxy(request("admin.staging.bemol.com.ar", "/admin//evil.test"));

  expect(new URL(response.headers.get("location")!).origin).toBe("https://admin.staging.bemol.com.ar");
});

it.each(["/admin/auth/login", "/api/admin/account"])("rejects administrative mutations outside the platform host: %s", async (path) => {
  const response = await proxy(request("staging.bemol.com.ar", path, "POST"));

  expect(response.status).toBe(404);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not replay legacy administrative form submissions", async () => {
  const response = await proxy(request("admin.staging.bemol.com.ar", "/admin/auth/login", "POST"));

  expect(response.status).toBe(404);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not offer institutional API sessions on the administrative host", async () => {
  const response = await proxy(request("admin.staging.bemol.com.ar", "/api/institutional/account", "GET", true));

  expect(response.status).toBe(404);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("preserves the raw internal origin when NextURL normalizes a loopback hostname", async () => {
  const previous = process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE;

  process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE = "true";
  process.env.PLATFORM_PUBLIC_URL = "http://admin.localhost:3000";

  try {
    const incoming = new NextRequest("http://127.0.0.1:3000/auth/login", { headers: { host: "admin.localhost:3000" } });

    expect(incoming.nextUrl.hostname).toBe("localhost");

    const response = await proxy(incoming);

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://127.0.0.1:3000/admin/auth/login");
    expect(response.headers.get("location")).toBeNull();
  } finally {
    if (previous === undefined) {
      delete process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE;
    } else {
      process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE = previous;
    }
  }
});
