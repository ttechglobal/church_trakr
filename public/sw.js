// ChurchTrakr Service Worker
// Offline-first with background sync for attendance saves

var CACHE = 'churchtrakr-v2';
var OFFLINE_QUEUE_KEY = 'churchtrakr-offline-queue';

var PRECACHE = [
  '/',
  '/index.html',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // Never intercept Supabase, Termii, or auth calls
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('termii.com') ||
    url.pathname.includes('/auth/')
  ) return;

  // Navigation requests — serve app shell, fall back to cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Static assets — cache first, then network
  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(req, clone); });
        }
        return res;
      }).catch(function() {
        return cached;
      });
    })
  );
});

// ── Background sync for offline attendance saves ──────────────────────────────
self.addEventListener('sync', function(e) {
  if (e.tag === 'attendance-sync') {
    e.waitUntil(flushOfflineQueue());
  }
});

function flushOfflineQueue() {
  return self.clients.matchAll().then(function(clients) {
    if (clients.length > 0) {
      // Tell the app to flush its offline queue
      clients.forEach(function(client) {
        client.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' });
      });
    }
  });
}

// ── Push notifications ────────────────────────────────────────────────────────
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

// ── Notification click ────────────────────────────────────────────────────────
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

// ── Skip waiting on message ───────────────────────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});