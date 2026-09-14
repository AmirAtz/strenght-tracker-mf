const CACHE = "lpg-v2";
const ASSETS = ["./", "./index.html", "./lifting-percentages.html"];

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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) {
        fetch(req).then((r) => {
          if (r && r.ok && req.url.startsWith(self.location.origin)) {
            caches.open(CACHE).then((c) => c.put(req, r.clone()));
          }
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then((r) => {
        if (r && r.ok && req.url.startsWith(self.location.origin)) {
          const clone = r.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return r;
      }).catch(() => {
        if (req.mode === "navigate") return caches.match("./index.html") || caches.match("./lifting-percentages.html") || caches.match("./");
        return Response.error();
      });
    })
  );
});
