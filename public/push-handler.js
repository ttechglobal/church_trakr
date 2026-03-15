// public/push-handler.js
// Plain JS push notification handlers — no ES module imports.
// Loaded by the Workbox-generated service worker via importScripts().

self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; }
  catch(err) { data = { title: 'ChurchTrakr', body: e.data ? e.data.text() : '' }; }

  e.waitUntil(
    self.registration.showNotification(data.title || 'ChurchTrakr', {
      body:     data.body    || '',
      icon:     data.icon    || '/icons/icon-192.png',
      badge:    '/icons/icon-192.png',
      tag:      data.tag     || 'churchtrakr',
      data:     data.data    || {},
      vibrate:  [200, 100, 200],
      renotify: !!data.renotify,
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
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});