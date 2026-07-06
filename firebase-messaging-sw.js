// Deprecated: Live खाata now uses a single service worker (sw.js) for both
// offline caching and FCM notifications. This file remains only so any old
// client that still references it resolves to the real, unified SW.
importScripts('/sw.js');
