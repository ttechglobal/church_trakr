var CACHE = 'churchtrakr-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('termii.com')) return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/');
      });
    })
  );
});

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'ChurchTrakr', {
      body:    data.body  || '',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      tag:     data.tag   || 'churchtrakr',
      data:    data.data  || {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(wins) {
      for (var i = 0; i < wins.length; i++) {
        if (wins[i].url.indexOf(self.location.origin) !== -1) {
          wins[i].focus();
          wins[i].navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});