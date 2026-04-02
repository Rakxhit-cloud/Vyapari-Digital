const CACHE_NAME = 'hisaabkitaab-v4';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Don't cache anything — always fetch fresh
  event.respondWith(fetch(event.request));
});
