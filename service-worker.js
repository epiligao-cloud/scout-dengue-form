// SCOUT Dengue Case Form -- offline app shell cache.
//
// Bump CACHE_NAME whenever any precached file changes, so returning phones
// pick up the update instead of being stuck on a stale cached copy forever.
// This is separate from FORM_VERSION in index.html (that one guards what the
// SERVER will accept; this one guards what gets served from THIS phone's
// cache).
const CACHE_NAME = 'scout-dengue-form-v2';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png',
  './vendor/geocoder/Control.Geocoder.min.js',
  './vendor/geocoder/Control.Geocoder.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Never intercept the actual case submissions or anything non-GET -- the
  // page's own fetch()/queue logic handles those directly, including what
  // happens when there's no connection. Caching or rewriting that request
  // here would silently break the offline-queue's own retry/error handling.
  if(req.method !== 'GET') return;

  // Don't cache calls to the Apps Script backend (the ping check, or any
  // future GET-based reads) -- that data is never meant to be served stale.
  if(req.url.indexOf('script.google.com') !== -1) return;

  event.respondWith(
    // ignoreSearch: true -- a link like "?code=..." (the no-typing setup
    // link/QR code) is a DIFFERENT request URL than the plain cached page,
    // so without this a phone that already has the app cached could still
    // fail to open it offline just because it was opened via that link.
    // This treats "/index.html" and "/index.html?code=xyz" as the same
    // cached page, which is correct here -- the query string only matters
    // to the page's own JS (it reads it once, then cleans the address bar),
    // never to which file should be served.
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        // Opportunistically cache any other same-origin asset actually used
        // (e.g. a future icon size), so a second visit is fully offline too.
        if(res && res.ok && req.url.indexOf(self.location.origin) === 0){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached); // offline and not precached: nothing we can do
    })
  );
});
