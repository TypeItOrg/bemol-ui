import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { GET as searchPlatform } from "@app/api/admin/search/route";
import { GET as searchInstitutional } from "@app/api/institutional/search/route";

const API_URL = "https://api.example.test";
const institutionId = "019848b9-2e20-7a11-992a-87e71b86ce6b";
const personId = "22222222-2222-4222-8222-222222222222";
const mockCookies = new Map<string, string>();
const requests: Request[] = [];
const payload = { groups: [{ entityType: "USER", items: [{ id: personId, title: "Matías Delgado" }], hasMore: false }] };
const originalEnvironment = {
  BEMOL_API_URL: process.env.BEMOL_API_URL,
  INSTITUTIONAL_BASE_DOMAIN: process.env.INSTITUTIONAL_BASE_DOMAIN,
};

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (mockCookies.has(name) ? { value: mockCookies.get(name) } : undefined) }),
}));

const server = setupServer(
  http.get(`${API_URL}/api/v1/*`, ({ request }) => {
    requests.push(request);

    return HttpResponse.json(payload);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  process.env.BEMOL_API_URL = API_URL;
  process.env.INSTITUTIONAL_BASE_DOMAIN = "";
  mockCookies.set("platform_access_token", "platform-token");
  mockCookies.set("institutional_access_token", "institutional-token");
  requests.length = 0;
});
afterEach(() => {
  server.resetHandlers();
  mockCookies.clear();
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

describe.each([
  {
    realm: "platform",
    get: searchPlatform,
    query: "",
    invalidQuery: "search=a",
    backendPath: "/api/v1/admin/search",
    token: "platform-token",
  },
  {
    realm: "institutional",
    get: searchInstitutional,
    query: `institutionId=${institutionId}&`,
    invalidQuery: "institutionId=invalid&search=rol",
    backendPath: `/api/v1/institutions/${institutionId}/search`,
    token: "institutional-token",
  },
])("$realm search route and authenticated transport", ({ get, query, invalidQuery, backendPath, token }) => {
  it("validates and encodes the query, uses its own session and streams actual response data", async () => {
    const response = await get(new Request(`https://app.example.test/api/search?${query}search=Mat%C3%ADas&limit=5`));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(`${API_URL}${backendPath}?search=Mat%C3%ADas&limit=5`);
    expect(requests[0].headers.get("authorization")).toBe(`Bearer ${token}`);
    expect(requests[0].headers.get("accept")).toBe("application/json");
    expect(requests[0].cache).toBe("no-store");
  });

  it("rejects malformed input before making an HTTP request", async () => {
    const response = await get(new Request(`https://app.example.test/api/search?${invalidQuery}`));

    expect(response.status).toBe(400);
    expect(requests).toHaveLength(0);
  });

  it("preserves backend authorization errors and their correlation ID", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/*`, () =>
        HttpResponse.json({ message: "No autorizado." }, { status: 401, headers: { "x-request-id": "search-request" } }),
      ),
    );

    const response = await get(new Request(`https://app.example.test/api/search?${query}search=rol`));

    expect(response.status).toBe(401);
    expect(response.headers.get("x-request-id")).toBe("search-request");
    await expect(response.json()).resolves.toEqual({ message: "No autorizado." });
  });

  it("maps a transport outage to service unavailable without exposing diagnostics", async () => {
    server.use(http.get(`${API_URL}/api/v1/*`, () => HttpResponse.error()));

    const response = await get(new Request(`https://app.example.test/api/search?${query}search=rol`));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "El servicio de búsqueda no está disponible." });
  });
});

it("keeps a selected dependent in the institutional self-service path, never the platform session", async () => {
  const response = await searchInstitutional(
    new Request(`https://app.example.test/api/institutional/search?institutionId=${institutionId}&personId=${personId}&search=piano&limit=4`),
  );

  expect(response.status).toBe(200);
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toBe(`${API_URL}/api/v1/institutions/${institutionId}/self-service/${personId}/search?search=piano&limit=4`);
  expect(requests[0].headers.get("authorization")).toBe("Bearer institutional-token");
});
