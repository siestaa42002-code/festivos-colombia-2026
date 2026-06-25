// Service worker básico con estrategia cache-first
const CACHE_NAME = "festivos-v1";
const ARCHIVOS_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/pascua.js",
  "/manifest.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) => {
      return Promise.all(
        nombres
          .filter((n) => n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Solo cachear GET
  if (event.request.method !== "GET") return;

  // No cachear las llamadas a la API
  if (event.request.url.includes("/api/")) return;

  // No cachear fonts de Google (que sigan funcionando online)
  if (event.request.url.includes("fonts.googleapis.com") || event.request.url.includes("fonts.gstatic.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cacheada) => {
      if (cacheada) return cacheada;

      return fetch(event.request).then((respuesta) => {
        // Solo cachear respuestas válidas del mismo origen
        if (!respuesta || respuesta.status !== 200 || respuesta.type !== "basic") {
          return respuesta;
        }
        const clon = respuesta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clon));
        return respuesta;
      }).catch(() => {
        // Si no hay red ni cache, devolver una respuesta vacía
        return new Response("Sin conexión", { status: 503, statusText: "Offline" });
      });
    })
  );
});