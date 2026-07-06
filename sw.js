// ═══════════════════════════════════════════════════════════════════════
// Live खाता — unified Service Worker
//   1. Offline app-shell caching (precache + fetch strategies)
//   2. FCM background notifications
// Single SW at scope '/'. saveFCMToken() reuses this registration, so there
// is no longer a competing firebase-messaging-sw.js at the same scope.
// ═══════════════════════════════════════════════════════════════════════

const FBV = '10.12.0';
const SHELL_CACHE = 'livekhaata-shell-v7';

// App shell that must be available offline. index.html imports the 5 Firebase
// ES modules below at boot — without them the app cannot start offline.
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json',
  '/icon-192.png', '/icon-512.png', '/icon-512-maskable.png',
  'https://www.gstatic.com/firebasejs/' + FBV + '/firebase-app.js',
  'https://www.gstatic.com/firebasejs/' + FBV + '/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/' + FBV + '/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/' + FBV + '/firebase-app-check.js',
  'https://www.gstatic.com/firebasejs/' + FBV + '/firebase-messaging.js'
];

// ── FCM background notifications ───────────────────────────────────────
// Wrapped so that if the messaging SDK fails to load (e.g. offline SW start),
// the offline fetch handler below still works — notifications degrade, the
// app does not.
const APP_ICON = 'https://livekhaata.app/icon-192.png';
const APP_URL  = 'https://livekhaata.app/index.html?src=play';
try {
  importScripts('https://www.gstatic.com/firebasejs/' + FBV + '/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/' + FBV + '/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyDzhDpkkjXKWRd1EAbgr3AXe6yFHmXJ9W4",
    authDomain: "hisaab-kitaab-9ff45.firebaseapp.com",
    projectId: "hisaab-kitaab-9ff45",
    storageBucket: "hisaab-kitaab-9ff45.firebasestorage.app",
    messagingSenderId: "143662976042",
    appId: "1:143662976042:web:63b9ca1e72a1150ba50753"
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload) {
    const n = payload.notification || {};
    const d = payload.data || {};
    const title = n.title || d.title || '📒 Live खाता';
    const body  = n.body  || d.body  || 'आज की एंट्री करना न भूलें!';
    return self.registration.showNotification(title, {
      body: body,
      icon: d.icon || APP_ICON,
      badge: APP_ICON,
      vibrate: [200, 100, 200],
      tag: d.tag || 'hk-daily-reminder',
      renotify: true,
      data: { url: d.url || APP_URL }
    });
  });
} catch (e) {
  // Messaging unavailable — offline caching still functions.
}

// Notification click — focus an open window or open the app.
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || APP_URL;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.url.indexOf('livekhaata') !== -1 && 'focus' in c) {
          if ('navigate' in c) { return c.navigate(target).then(() => c.focus()).catch(() => c.focus()); }
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

// ── INSTALL: precache the app shell ────────────────────────────────────
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function(cache) {
      // allSettled: one 404 must not fail the whole precache / install.
      return Promise.allSettled(
        PRECACHE_URLS.map(function(u) { return cache.add(new Request(u, { cache: 'reload' })); })
      );
    })
  );
});

// ── ACTIVATE: drop OLD caches only (keep the current shell), take control ─
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) { return n !== SHELL_CACHE; })
                              .map(function(n) { return caches.delete(n); }));
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
        list.forEach(function(c) { c.postMessage({ type: 'SW_UPDATED', version: SHELL_CACHE }); });
      });
    })
  );
});

// ── FETCH: offline strategies ──────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // BYPASS backend/dynamic hosts entirely. Firestore keeps its own offline
  // data in IndexedDB; App Check/reCAPTCHA and auth must reach the network
  // (and fail gracefully offline). We must never cache or intercept these.
  const BYPASS = [
    'firestore.googleapis.com', 'firebaseinstallations.googleapis.com',
    'fcmregistrations.googleapis.com', 'fcm.googleapis.com',
    'identitytoolkit.googleapis.com', 'securetoken.googleapis.com',
    'firebasedatabase.app', 'google.com/recaptcha', 'gstatic.com/recaptcha',
    'recaptcha.net', 'firebaselogging'
  ];
  for (let i = 0; i < BYPASS.length; i++) {
    if (req.url.indexOf(BYPASS[i]) !== -1) return;
  }

  // NAVIGATION (the app document) → network-first, fall back to cached shell.
  // Keeps deploys instant online; serves the cached app offline. ignoreSearch
  // so '/index.html?src=play' and '/?...' both resolve to the cached shell.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then(function(res) {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then(function(c) { c.put('/index.html', copy); }).catch(function(){});
        return res;
      }).catch(function() {
        return caches.match('/index.html', { ignoreSearch: true }).then(function(r) {
          return r || caches.match('/', { ignoreSearch: true });
        });
      })
    );
    return;
  }

  // Firebase SDK modules + static assets → cache-first, refresh in background.
  if (req.url.indexOf('/firebasejs/') !== -1 ||
      /\.(png|svg|jpg|jpeg|webp|ico|json|css|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        const net = fetch(req).then(function(res) {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then(function(c) { c.put(req, copy); }).catch(function(){});
          }
          return res;
        }).catch(function() { return cached; });
        return cached || net;
      })
    );
    return;
  }

  // Everything else → try network, fall back to any cached copy.
  event.respondWith(fetch(req).catch(function() { return caches.match(req); }));
});
