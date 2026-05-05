// Cache bust: 2026-05-04-v4 - manifest update + name fix
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

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
  const title = payload.notification?.title || '📒 हिसाब-Kitaab';
  const options = {
    body: payload.notification?.body || 'आज की एंट्री करना न भूलें!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'hk-daily-reminder',
    renotify: true,
    data: { url: '/' }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('hisaabkitab') && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      // Clear ALL caches (more aggressive than before)
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(name) { return caches.delete(name); }));
      }),
      // Take control of all open pages immediately
      self.clients.claim()
    ]).then(function() {
      // Notify all open clients to reload manifest reference
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({ type: 'SW_UPDATED', version: '2026-05-04-v4' });
        });
      });
    })
  );
});
