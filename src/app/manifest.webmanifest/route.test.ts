import { GET } from "@app/manifest.webmanifest/route";

const fetchMock = jest.fn();

function request(host: string): Request {
  return new Request(`https://${host}/manifest.webmanifest`, {
    headers: { host, "X-Institutional-Host": "forged.example.test", "X-Forwarded-Host": "forged.example.test" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  jest.replaceProperty(process, "env", {
    ...process.env,
    BEMOL_API_URL: "http://backend.test",
    FRONTEND_PUBLIC_URL: "https://example.test",
    INSTITUTIONAL_BASE_DOMAIN: "example.test",
  });
  jest.spyOn(global, "fetch").mockImplementation(fetchMock);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("offers the platform app on the generic host without an institution lookup", async () => {
  const response = await GET(request("example.test"));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/manifest+json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toMatchObject({
    id: "/",
    name: "Bemol - Administración",
    short_name: "Bemol - Administración",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
  });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("resolves successive institutions independently using the actual host and relative resources", async () => {
  for (const [publicSubdomain, name, shortName] of [
    ["cboero", "Conservatorio Superior de Música Boero", "Boero"],
    ["otra", "Otra institución", null],
  ]) {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        id: "22222222-2222-4222-8222-222222222222",
        publicSubdomain: publicSubdomain,
        name,
        shortName,
        logoUrl: null,
      }),
    );
    const response = await GET(request(`${publicSubdomain}.example.test`));
    const manifest = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(manifest).toMatchObject({
      name: shortName || name,
      short_name: shortName || name,
      start_url: "/",
      id: "/",
      scope: "/",
      display: "standalone",
    });
    expect(manifest.icons).toEqual([
      { src: "/brand/pwa-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ]);
    expect(fetchMock.mock.lastCall[0].pathname).toBe(`/api/v1/institutions/by-subdomain/${publicSubdomain}`);
    expect(fetchMock.mock.lastCall[1]).toMatchObject({ cache: "no-store", headers: { "X-Institutional-Host": `${publicSubdomain}.example.test` } });
  }
});

it.each(["unknown.test", "nested.cboero.example.test"])("rejects invalid host %s without looking it up", async (host) => {
  const response = await GET(request(host));
  expect(response.status).toBe(404);
  expect(await response.text()).toBe("");
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([404, 503])("preserves institution resolution failure %s instead of serving the platform manifest", async (status) => {
  fetchMock.mockResolvedValue(new Response(null, { status }));
  const response = await GET(request("cboero.example.test"));
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).toBe("");
});

it("returns 503 for network failures and malformed institutional data", async () => {
  fetchMock.mockRejectedValueOnce(new Error("unavailable"));
  expect((await GET(request("cboero.example.test"))).status).toBe(503);
  fetchMock.mockResolvedValueOnce(Response.json({ name: "not an institution" }));
  expect((await GET(request("cboero.example.test"))).status).toBe(503);
});
