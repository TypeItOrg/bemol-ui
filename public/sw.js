const CACHE_PREFIX = "bemol-pwa-offline-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // RSC fetches and Server Actions are not GET document navigations.
  if (request.method !== "GET" || request.mode !== "navigate" || !request.headers.get("accept")?.includes("text/html")) {
    return;
  }

  const url = new URL(request.url);
  const isApiPath = url.pathname === "/api" || url.pathname.startsWith("/api/");
  const isAssetPath = url.pathname.startsWith("/_next/") || (/\.[^/]+$/.test(url.pathname) && url.pathname !== OFFLINE_URL);

  if (url.origin !== self.location.origin || isApiPath || isAssetPath) {
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);

      return (await cache.match(OFFLINE_URL)) ?? Response.error();
    }),
  );
});
