// Service Worker — cache shell + pages menu pour mode hors-ligne
const CACHE_STATIC = "smart-menu-static-v2";
const CACHE_PAGES = "smart-menu-pages-v2";
const CACHE_IMAGES = "smart-menu-images-v2";

const PRECACHE = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_MENU" && event.data.url) {
    event.waitUntil(cacheMenuPage(event.data.url));
  }
});

async function cacheMenuPage(url) {
  try {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) return;
    const cache = await caches.open(CACHE_PAGES);
    await cache.put(url, response);
  } catch {
    // Hors-ligne ou erreur réseau — ignoré
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Pages menu : réseau d'abord, cache en secours (offline)
  if (request.mode === "navigate" && url.pathname.startsWith("/menu/")) {
    event.respondWith(networkFirstMenu(request));
    return;
  }

  // Images (Supabase Storage, Next Image, locales)
  if (request.destination === "image") {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // Assets statiques same-origin
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});

async function networkFirstMenu(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await caches.match("/");
    if (fallback) return fallback;
    return new Response("Menu hors-ligne — reconnectez-vous pour actualiser.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirstImage(request) {
  const cache = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}
