/* Finance Tracker Service Worker
   Update CACHE_NAME to force refresh after deploys.
*/
const CACHE_NAME = 'finance-tracker-v1-20251003183348';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const req = event.request;

  // App shell style for navigations
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;

        const networkResp = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, networkResp.clone());
        return networkResp;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Stale-while-revalidate for other GETs
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const networkPromise = fetch(req)
      .then((resp) => {
        cache.put(req, resp.clone());
        return resp;
      })
      .catch(() => undefined);

    if (cached) {
      // Return cached immediately, update in background
      return cached;
    }
    return networkPromise || new Response('', { status: 503, statusText: 'Offline' });
  })());
});
