/* ZUS Coffee Ngupi — Service Worker */
const CACHE_NAME = "ngupi-v1";
const CORE_ASSETS = [
  "/zuscoffee/",
  "/zuscoffee/index.html",
  "/zuscoffee/logo.webp",
  "/zuscoffee/manifest.json"
];

/* Install — cache core assets */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* Activate — clean old caches */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Fetch — network-first for HTML, cache-first for assets */
self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isHTML = req.headers.get("accept") &&
                 req.headers.get("accept").indexOf("text/html") !== -1;

  if (isHTML) {
    /* Network-first for pages */
    event.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("/zuscoffee/index.html");
        });
      })
    );
  } else {
    /* Cache-first for static assets */
    event.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (res) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          return res;
        });
      })
    );
  }
});
