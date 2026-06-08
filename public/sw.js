// Kolab PWA Service Worker
// Cache name with version for easy updates
const CACHE_NAME = "kolab-cache-v1";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/site.webmanifest",
  "/kolab.png",
  "/logo.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

// Install event — pre-cache key assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  // Activate immediately without waiting for reload
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event — network-first strategy for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // For navigation requests (HTML pages), try network first, fall back to cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match("/dashboard");
          });
        }),
    );
    return;
  }

  // For static assets (images, fonts, etc.), use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    }),
  );
});
