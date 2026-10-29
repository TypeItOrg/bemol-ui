import { NextRequest } from "next/server";

import { waitFor } from "@testing-library/react";

import {
  INSTITUTIONAL_ACCESS_TOKEN_COOKIE,
  INSTITUTIONAL_REFRESH_TOKEN_COOKIE,
} from "@features/institutional-auth/utils/institutional-auth-cookies.util";

import { proxy } from "@/proxy";

const boeroInstitution = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Conservatorio Boero",
  publicSubdomain: "cboero",
  logoUrl: null,
};

const otherInstitution = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Otra institución",
  publicSubdomain: "otra",
  logoUrl: null,
};

const fetchMock = jest.fn();
const originalEnvironment = {
  BEMOL_API_URL: process.env.BEMOL_API_URL,
  FRONTEND_PUBLIC_URL: process.env.FRONTEND_PUBLIC_URL,
  INSTITUTIONAL_BASE_DOMAIN: process.env.INSTITUTIONAL_BASE_DOMAIN,
};
const originalFetch = global.fetch;

function createRequest(
  host: string,
  {
    path = "/auth/login",
    method = "GET",
    cookies = "",
    headers = {},
  }: {
    path?: string;
    method?: string;
    cookies?: string;
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  return new NextRequest(`https://${host}${path}`, {
    method,
    headers: { host, cookie: cookies, accept: "text/html", ...headers },
  });
}

beforeEach(() => {
  process.env.BEMOL_API_URL = "http://backend.test";
  process.env.FRONTEND_PUBLIC_URL = "https://testing.typeit.com.ar";
  process.env.INSTITUTIONAL_BASE_DOMAIN = "testing.typeit.com.ar";

  fetchMock.mockReset();
  global.fetch = fetchMock;
});

afterAll(() => {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  global.fetch = originalFetch;
});

it("[A03.untrusted-header] strips forged internal tenant headers on generic requests", async () => {
  const response = await proxy(
    createRequest("testing.typeit.com.ar", {
      headers: {
        "X-Institutional-Host": "cboero.testing.typeit.com.ar",
        "X-Forwarded-Host": "cboero.testing.typeit.com.ar",
      },
    }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("x-middleware-request-x-institutional-host")).toBe("testing.typeit.com.ar");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("[A03.untrusted-header] rebuilds branded context from actual configured Host", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(boeroInstitution)));

  const response = await proxy(
    createRequest("cboero.testing.typeit.com.ar", {
      headers: { "X-Institutional-Host": "otra.testing.typeit.com.ar" },
    }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("x-middleware-request-x-institutional-host")).toBe("cboero.testing.typeit.com.ar");
});

it.each([404, 503])("[I02.unknown-inactive] branded lookup failure %s with a healthy API keeps the institutional error", async (status) => {
  fetchMock.mockImplementation(async (url: URL) =>
    url.pathname === "/actuator/health/readiness" ? Response.json({ status: "UP" }) : new Response(null, { status }),
  );

  const response = await proxy(createRequest("cboero.testing.typeit.com.ar"));

  expect(response.status).toBe(status);
  expect(response.headers.get("x-middleware-rewrite")).toContain("/institutional-unavailable");
  expect(response.headers.get("x-middleware-rewrite")).toContain(`status=${status}`);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(fetchMock).toHaveBeenCalledTimes(status === 404 ? 1 : 2);
});

it.each(["GET", "HEAD"])("[I02.unavailable] HTTP outage serves maintenance for HTML %s navigation", async (method) => {
  fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

  const response = await proxy(createRequest("cboero.testing.typeit.com.ar", { method }));

  expect(response.status).toBe(503);
  expect(response.headers.get("x-middleware-rewrite")).toBe("https://cboero.testing.typeit.com.ar/maintenance.html");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("retry-after")).toBe("5");
  expect(fetchMock.mock.calls[1][0].pathname).toBe("/actuator/health/readiness");
});

it("[I02.unavailable] transport outage serves maintenance without redirecting away from the original page", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));

  const response = await proxy(createRequest("cboero.testing.typeit.com.ar", { path: "/self-service?tab=enrollments" }));

  expect(response.status).toBe(503);
  expect(response.headers.get("x-middleware-rewrite")).toBe("https://cboero.testing.typeit.com.ar/maintenance.html");
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("retry-after")).toBe("5");
});

it.each<{ name: string; path: string; method: string; headers: Record<string, string>; json: boolean }>([
  { name: "API JSON", path: "/api/institutional/search", method: "GET", headers: { accept: "application/json" }, json: true },
  { name: "RSC", path: "/self-service", method: "GET", headers: { rsc: "1" }, json: false },
  { name: "Server Action", path: "/self-service", method: "POST", headers: { "next-action": "action-id" }, json: false },
])("[I02.unavailable] outage never serves maintenance HTML for $name requests", async ({ path, method, headers, json }) => {
  fetchMock.mockRejectedValue(new Error("offline"));

  const response = await proxy(
    createRequest("cboero.testing.typeit.com.ar", {
      path,
      method,
      headers,
      cookies: `${INSTITUTIONAL_REFRESH_TOKEN_COOKIE}=existing-refresh`,
    }),
  );

  expect(response.status).toBe(503);
  expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("retry-after")).toBe("5");
  expect(response.cookies.get(INSTITUTIONAL_REFRESH_TOKEN_COOKIE)).toBeUndefined();

  if (json) {
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ message: expect.any(String) });
  } else {
    await expect(response.text()).resolves.toBe("");
  }
});

it("[A02.no-logo] health probe on branded host does not require tenant resolution", async () => {
  const response = await proxy(
    createRequest("cboero.testing.typeit.com.ar", {
      path: "/api/health",
      headers: { "X-Institutional-Host": "otra.testing.typeit.com.ar" },
    }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("x-middleware-request-x-institutional-host")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("[A05.refresh-regression] shared endpoint/token refresh is revalidated separately per host before cookies propagate", async () => {
  let completeRefresh: (response: Response) => void = () => {};

  fetchMock.mockImplementation(async (url: URL, init: RequestInit) => {
    if (url.pathname.endsWith("/by-subdomain/cboero")) {
      return new Response(JSON.stringify(boeroInstitution));
    }

    if (url.pathname.endsWith("/by-subdomain/otra")) {
      return new Response(JSON.stringify(otherInstitution));
    }

    if (url.pathname.endsWith("/refresh")) {
      return new Promise<Response>((resolve) => {
        completeRefresh = resolve;
      });
    }

    const host = new Headers(init.headers).get("X-Institutional-Host");

    return new Response(null, { status: host === "cboero.testing.typeit.com.ar" ? 200 : 403 });
  });

  const cookies = `${INSTITUTIONAL_REFRESH_TOKEN_COOKIE}=opaque-rotating-refresh`;

  // The wrong-host caller cannot poison the valid caller's shared refresh.
  const wrongHostRequest = proxy(
    createRequest("otra.testing.typeit.com.ar", {
      path: "/api/institutional/search",
      cookies,
    }),
  );
  const validHostRequest = proxy(
    createRequest("cboero.testing.typeit.com.ar", {
      path: "/api/institutional/search",
      cookies,
    }),
  );

  await waitFor(() => {
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/refresh"));
    expect(refreshCalls).toHaveLength(1);
  });

  completeRefresh(
    new Response(
      JSON.stringify({
        tokens: { accessToken: "new-access", refreshToken: "new-refresh" },
      }),
    ),
  );

  const [wrongHostResponse, validHostResponse] = await Promise.all([wrongHostRequest, validHostRequest]);
  const refreshInit = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/refresh"))[1];

  expect(new Headers(refreshInit.headers).has("X-Institutional-Host")).toBe(false);
  expect(wrongHostResponse.status).toBe(403);
  expect(wrongHostResponse.cookies.get(INSTITUTIONAL_ACCESS_TOKEN_COOKIE)).toBeUndefined();
  expect(wrongHostResponse.cookies.get(INSTITUTIONAL_REFRESH_TOKEN_COOKIE)).toBeUndefined();
  expect(wrongHostResponse.headers.get("x-middleware-request-cookie")).toBeNull();

  expect(validHostResponse.cookies.get(INSTITUTIONAL_ACCESS_TOKEN_COOKIE)?.value).toBe("new-access");
  expect(validHostResponse.cookies.get(INSTITUTIONAL_REFRESH_TOKEN_COOKIE)?.value).toBe("new-refresh");
  expect(validHostResponse.headers.get("x-middleware-request-cookie")).toContain("new-refresh");
});

it.each([401, 403, 503])("[A05.refresh-regression] preserves cookies when post-refresh host validation returns %s", async (status) => {
  fetchMock.mockImplementation(async (url: URL) => {
    if (url.pathname.includes("/by-subdomain/")) {
      return new Response(JSON.stringify(boeroInstitution));
    }

    if (url.pathname.endsWith("/refresh")) {
      return new Response(
        JSON.stringify({
          tokens: { accessToken: "new-access", refreshToken: "new-refresh" },
        }),
      );
    }

    return new Response(null, { status });
  });

  const response = await proxy(
    createRequest("cboero.testing.typeit.com.ar", {
      path: "/api/institutional/search",
      cookies: `${INSTITUTIONAL_REFRESH_TOKEN_COOKIE}=refresh-${status}`,
    }),
  );

  expect(response.status).toBe(status === 403 ? 403 : 503);
  expect(response.cookies.get(INSTITUTIONAL_REFRESH_TOKEN_COOKIE)).toBeUndefined();
});
