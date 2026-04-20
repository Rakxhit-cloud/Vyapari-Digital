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
    renotify: true
  };
  return self.registration.showNotification(title, options);
});
