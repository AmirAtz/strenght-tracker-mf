const CACHE = "lpg-v3";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(ASSETS.map((u) => c.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function cachePut(req, res) {
  if (res && res.ok && req.url.startsWith(self.location.origin)) {
    const clone = res.clone();
    caches.open(CACHE).then((c) => c.put(req, clone));
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isDoc = req.mode === "navigate" || req.destination === "document" ||
                req.url.endsWith("/") || /index\.html(\?|$)/.test(req.url);

  if (isDoc) {
    e.respondWith(
      fetch(req).then((r) => { cachePut(req, r); return r; })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((h) => h || caches.match("./index.html") || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) {
        fetch(req).then((r) => cachePut(req, r)).catch(() => {});
        return hit;
      }
      return fetch(req).then((r) => { cachePut(req, r); return r; })
        .catch(() => Response.error());
    })
  );
});
