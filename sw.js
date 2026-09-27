/* Root service worker — retires the old app worker that used to live at "/".
   The app now runs from /app/ with its own worker. This file clears the old
   caches (never the app's own 'lk-app-*' cache) once, unregisters itself, and reloads open pages so the website shows. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    try{ var keys = await caches.keys(); await Promise.all(keys.filter(function(k){ return k.indexOf('lk-app-') !== 0; }).map(function(k){ return caches.delete(k); })); }catch(err){}
    await self.registration.unregister();
    var cs = await self.clients.matchAll({ type:'window' });
    cs.forEach(function(c){ try{ c.navigate(c.url); }catch(err){} });
  })());
});
