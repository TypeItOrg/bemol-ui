import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { LOCATION_ERROR_MESSAGES } from "@features/locations/constants/error-messages.constants";

import { GET as getCities } from "@app/api/cities/route";
import { GET as getCountryProvinces } from "@app/api/countries/[countryId]/provinces/route";
import { GET as getCountries } from "@app/api/countries/route";
import { GET as getProvinceCities } from "@app/api/provinces/[provinceId]/cities/route";

const API_URL = "https://api.example.test";
const LOCATION_ID = "019e18e4-c93b-7583-90a6-0e9410ce3ad3";
const originalApiUrl = process.env.BEMOL_API_URL;
const requests: Request[] = [];
const payload = { items: [{ id: LOCATION_ID, name: "Córdoba" }], page: 2, totalPages: 3 };
const server = setupServer(
  http.get(`${API_URL}/api/v1/*`, ({ request }) => {
    requests.push(request);

    return HttpResponse.json(payload);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();

  if (originalApiUrl === undefined) {
    delete process.env.BEMOL_API_URL;
  } else {
    process.env.BEMOL_API_URL = originalApiUrl;
  }
});

async function expectProxiedResponse(response: Response, path: string): Promise<void> {
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(payload);
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toBe(`${API_URL}${path}?page=2&size=20&search=C%C3%B3rdoba`);
  expect(requests[0].headers.get("accept")).toBe("application/json");
  expect(requests[0].headers.get("authorization")).toBeNull();
  expect(requests[0].cache).toBe("no-store");
  expect(requests[0].signal).toBeInstanceOf(AbortSignal);
}

describe("location routes and real HTTP transport", () => {
  const request = new Request("https://app.example.test/api/locations?page=2&size=20&search=C%C3%B3rdoba");

  beforeEach(() => {
    process.env.BEMOL_API_URL = API_URL;
    requests.length = 0;
  });

  it("proxies the countries collection", async () => {
    await expectProxiedResponse(await getCountries(request), "/api/v1/countries");
  });

  it("proxies the cities collection", async () => {
    await expectProxiedResponse(await getCities(request), "/api/v1/cities");
  });

  it("proxies provinces for a valid country", async () => {
    await expectProxiedResponse(
      await getCountryProvinces(request, { params: Promise.resolve({ countryId: LOCATION_ID }) }),
      `/api/v1/countries/${LOCATION_ID}/provinces`,
    );
  });

  it("proxies cities for a valid province", async () => {
    await expectProxiedResponse(
      await getProvinceCities(request, { params: Promise.resolve({ provinceId: LOCATION_ID }) }),
      `/api/v1/provinces/${LOCATION_ID}/cities`,
    );
  });

  it.each([
    ["country", () => getCountryProvinces(request, { params: Promise.resolve({ countryId: "invalid" }) })],
    ["province", () => getProvinceCities(request, { params: Promise.resolve({ provinceId: "invalid" }) })],
  ])("rejects an invalid %s identifier", async (_locationType, callRoute) => {
    const response = await callRoute();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: LOCATION_ERROR_MESSAGES.INVALID_LOCATION_ID,
    });
    expect(requests).toHaveLength(0);
  });

  it("preserves backend errors and request correlation", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/countries`, () =>
        HttpResponse.json({ message: "Catálogo no disponible" }, { status: 503, headers: { "x-request-id": "location-request" } }),
      ),
    );
    const response = await getCountries(request);

    expect(response.status).toBe(503);
    expect(response.headers.get("x-request-id")).toBe("location-request");
    await expect(response.json()).resolves.toEqual({ message: "Catálogo no disponible" });
  });

  it("returns a safe service-unavailable response on a network failure", async () => {
    server.use(http.get(`${API_URL}/api/v1/countries`, () => HttpResponse.error()));
    const response = await getCountries(request);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: LOCATION_ERROR_MESSAGES.LOCATION_SERVICE_UNAVAILABLE });
  });
});
