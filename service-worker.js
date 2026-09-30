// SCOUT Dengue Case Form -- offline app shell cache.
//
// HOW UPDATES WORK
//   1. A phone that's online checks for a new service-worker.js each time the
//      app opens (and when it's brought back to the foreground).
//   2. If the file changed, the new version downloads ALL its files in the
//      background into its own cache. If any file fails, the whole update is
//      abandoned and the phone keeps running the old, working version.
//   3. The new version then WAITS. It does not take over on its own -- the page
//      shows an "Update ready" bar, and the BHW taps it when it's a good moment.
//      (So an update can never swap the app out from under someone mid-form.)
//   4. Tapping it activates the new version and reloads the page. Saved cases,
//      drafts, and the access code live in localStorage, which updates never touch.
//
// VERSION is the human-readable label shown in the app's footer. CONTENT_HASH is
// filled in automatically by pack.py from the contents of every shipped file, so
// ANY change to any file produces a new cache name and is detected as an update
// -- forgetting to bump VERSION can no longer cause phones to miss an update.
const VERSION = 'v16';
const CONTENT_HASH = '9e36ba'; // auto-filled by pack.py -- do not edit by hand
const CACHE_PREFIX = 'scout-dengue-form-';
const CACHE_NAME = CACHE_PREFIX + VERSION + '-' + CONTENT_HASH;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
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
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(PRECACHE.map(url =>
        // cache: 'reload' skips the browser's normal HTTP cache. GitHub Pages lets
        // browsers reuse a file for ~10 minutes, so without this a phone updating
        // shortly after a publish could save the OLD index.html under the NEW
        // version's name -- looking updated while still running old code.
        fetch(new Request(url, { cache: 'reload' })).then(res => {
          if(!res.ok) throw new Error('Precache failed: ' + url + ' (' + res.status + ')');
          return cache.put(url, res);
        })
      ))
    )
  );
  // Deliberately no skipWaiting() here -- see "HOW UPDATES WORK" above.
  // (On a phone's very first install there is nothing to wait behind, so the
  // new worker activates immediately without it.)
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        // Only ever delete OUR OWN old caches. Every project published under the
        // same GitHub account shares one web address (and so one cache storage);
        // deleting "everything except mine" would wipe other apps' caches too.
        names.filter(n => n.indexOf(CACHE_PREFIX) === 0 && n !== CACHE_NAME)
             .map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if(data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  } else if(data.type === 'GET_VERSION' && event.ports && event.ports[0]){
    event.ports[0].postMessage({ version: VERSION, hash: CONTENT_HASH });
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Never intercept the actual case submissions or anything non-GET -- the
  // page's own fetch()/queue logic handles those directly, including what
  // happens when there's no connection.
  if(req.method !== 'GET') return;

  // Don't cache calls to the Apps Script backend.
  if(req.url.indexOf('script.google.com') !== -1) return;

  event.respondWith(
    // ignoreSearch: a link like "?code=..." is a different request URL than the
    // plain cached page; without this it could fail to open offline.
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        if(res && res.ok && req.url.indexOf(self.location.origin) === 0){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline and not precached. For a page navigation, fall back to the
        // app itself rather than the browser's "no connection" error page.
        if(req.mode === 'navigate') return caches.match('./index.html');
        return cached;
      });
    })
  );
});
