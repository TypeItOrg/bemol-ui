import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const origin = "https://cboero.example.test";
const cacheName = "bemol-pwa-offline-v1";
const source = readFileSync("public/sw.js", "utf8");
const handlers = new Map<string, (event: unknown) => void>();
const offline = new Response("offline fallback", { headers: { "Content-Type": "text/html" } });
const cache = { add: jest.fn(), match: jest.fn() };
const cachesMock = { open: jest.fn(), keys: jest.fn(), delete: jest.fn() };
const fetchMock = jest.fn();
const claim = jest.fn();

class WorkerRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, origin) : input, init);
  }
}

function navigation(path = "/enrollment", overrides = {}) {
  return {
    request: {
      url: new URL(path, origin).href,
      mode: "navigate",
      method: "GET",
      headers: new Headers({ Accept: "text/html" }),
      ...overrides,
    },
    respondWith: jest.fn(),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  handlers.clear();
  cache.add.mockResolvedValue(undefined);
  cache.match.mockResolvedValue(offline);
  cachesMock.open.mockResolvedValue(cache);
  cachesMock.keys.mockResolvedValue(["bemol-pwa-offline-v0", cacheName, "other-feature-cache"]);
  cachesMock.delete.mockResolvedValue(true);
  claim.mockResolvedValue(undefined);
  runInNewContext(source, {
    self: {
      location: { origin },
      clients: { claim },
      addEventListener: (name: string, callback: (event: unknown) => void) => handlers.set(name, callback),
    },
    caches: cachesMock,
    fetch: fetchMock,
    Request: WorkerRequest,
    Response,
    URL,
  });
});

it("precaches only the static fallback, bypassing the HTTP cache", async () => {
  const waitUntil = jest.fn();
  handlers.get("install")!({ waitUntil });
  await waitUntil.mock.calls[0][0];
  expect(cachesMock.open).toHaveBeenCalledWith(cacheName);
  expect(cache.add).toHaveBeenCalledTimes(1);
  expect(cache.add.mock.calls[0][0]).toMatchObject({ url: `${origin}/offline.html`, cache: "reload" });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("deletes only outdated caches it owns on activation", async () => {
  const waitUntil = jest.fn();
  handlers.get("activate")!({ waitUntil });
  await waitUntil.mock.calls[0][0];
  expect(cachesMock.delete).toHaveBeenCalledTimes(1);
  expect(cachesMock.delete).toHaveBeenCalledWith("bemol-pwa-offline-v0");
  expect(claim).toHaveBeenCalledTimes(1);
  expect(source).not.toContain("skipWaiting");
});

it.each([200, 303, 401, 403, 404, 500, 503])("passes through HTTP %s without replacing or caching the response", async (status) => {
  const response = new Response("server response", { status });
  fetchMock.mockResolvedValue(response);
  const event = navigation();
  handlers.get("fetch")!(event);
  expect(await event.respondWith.mock.calls[0][0]).toBe(response);
  expect(fetchMock).toHaveBeenCalledWith(event.request);
  expect(cachesMock.open).not.toHaveBeenCalled();
  expect(cache.add).not.toHaveBeenCalled();
});

it("returns the static page only when an HTML navigation loses network access", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  const event = navigation("/enrollment?step=2");
  handlers.get("fetch")!(event);
  expect(await event.respondWith.mock.calls[0][0]).toBe(offline);
  expect(cache.match).toHaveBeenCalledWith("/offline.html");
  expect(cache.add).not.toHaveBeenCalled();
});

it("preserves a network error when browser storage has evicted the fallback", async () => {
  fetchMock.mockRejectedValue(new TypeError("offline"));
  cache.match.mockResolvedValue(undefined);
  const event = navigation();
  handlers.get("fetch")!(event);
  const response = await event.respondWith.mock.calls[0][0];
  expect(response.type).toBe("error");
});

it.each([
  ["/api", {}],
  ["/api/institutional/session", {}],
  ["/api/public/institutions/logo", {}],
  ["/_next/static/chunk.js", {}],
  ["/manifest.webmanifest", {}],
  ["/attachment.pdf", {}],
  ["https://other.example.test/", {}],
  ["/enrollment", { method: "POST" }],
  ["/enrollment", { mode: "cors" }],
  ["/enrollment", { mode: "cors", headers: new Headers({ Accept: "text/x-component", RSC: "1" }) }],
  ["/enrollment", { mode: "same-origin", headers: new Headers({ RSC: "1" }) }],
  ["/enrollment", { method: "POST", mode: "cors", headers: new Headers({ Accept: "text/x-component", "Next-Action": "action-id" }) }],
  ["/enrollment", { headers: new Headers({ Accept: "application/pdf" }) }],
])("does not intercept %s with %j", (path, overrides) => {
  const event = navigation(path, overrides);
  handlers.get("fetch")!(event);
  expect(event.respondWith).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(cachesMock.open).not.toHaveBeenCalled();
});

it("ships a self-contained offline page with manual retry and no automatic replay", () => {
  const html = readFileSync("public/offline.html", "utf8");
  expect(html).toContain("Necesitás conexión para usar Bemol");
  expect(html).toContain("Revisá tu conexión a internet y volvé a intentarlo.");
  expect(html).toContain('type="button">Reintentar');
  expect(html).toContain("window.location.reload()");
  expect(html).not.toMatch(/(?:src|href)=["'](?:https?:|\/)/);
  expect(html).not.toContain('addEventListener("online"');
});
