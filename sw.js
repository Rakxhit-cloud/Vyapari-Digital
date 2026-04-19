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
icon: '/icons/icon-192.png',
badge: '/icons/icon-72.png',
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
if (clientList[i].url.includes('hisaabkitaab') && 'focus' in clientList[i]) {
return clientList[i].focus();
}
}
return clients.openWindow('/');
})
);
});
const CACHE_NAME = 'hk-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', e => {
e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
self.skipWaiting();
});
self.addEventListener('activate', e => {
e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e => {
e.respondWith(
caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html')))
);
});
