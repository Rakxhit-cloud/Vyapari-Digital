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

// Absolute URL constants — these guarantee the icon resolves regardless
// of whether the service worker is hosted on the custom domain or the
// GitHub Pages subpath. A relative path like '/icon-192.png' breaks on
// rakxhit-cloud.github.io/Vyapari-Digital/ because the leading slash
// points to the github.io root, not the project folder.
const APP_BASE_URL = 'https://hisaabkitaab.online';
const APP_ICON_URL = APP_BASE_URL + '/icon-192.png';
const APP_OPEN_URL = APP_BASE_URL + '/?source=notification';

// Background notifications (app closed or in background)
// We read from BOTH payload.notification AND payload.data so this handler
// works whether the Cloud Function sends a 'notification' payload (legacy)
// or a 'data' payload (current — gives us full control over icon + click).
messaging.onBackgroundMessage(function(payload) {
  const n = payload.notification || {};
  const d = payload.data || {};

  const title = n.title || d.title || 'हिसाब-Kitaab';
  const body  = n.body  || d.body  || 'आज की Entry करना न भूलें।';
  const icon  = d.icon  || APP_ICON_URL;
  const url   = d.url   || APP_OPEN_URL;
  const tag   = d.tag   || 'hk-daily-reminder';

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    image: icon,
    vibrate: [200, 100, 200],
    tag: tag,
    renotify: true,
    requireInteraction: false,
    data: { url: url }
  };
  return self.registration.showNotification(title, options);
});

// Notification click — opens the PWA (or focuses if already open)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || APP_OPEN_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // STEP 1 — If a PWA window is already open, focus it.
      // We match by the domain string 'hisaabkitaab' so both the
      // production domain and the GitHub Pages staging URL are caught.
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.indexOf('hisaabkitaab') !== -1 && 'focus' in client) {
          // Optionally navigate the existing PWA window to the target URL
          // before focusing, so the user lands where the notification points.
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(function() {
              return client.focus();
            }).catch(function() {
              return client.focus();
            });
          }
          return client.focus();
        }
      }
      // STEP 2 — No PWA window open. Open a new one at the target URL.
      // On Android Chrome, if the user has installed the PWA, Chrome will
      // automatically route this to the installed PWA window (because the
      // URL falls within the manifest's scope) rather than a browser tab.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
