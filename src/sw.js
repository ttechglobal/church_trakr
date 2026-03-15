// src/sw.js
// This file is the SERVICE WORKER SOURCE for vite-plugin-pwa (injectManifest strategy).
// At build time, Workbox injects the auto-generated precache manifest
// where it sees `self.__WB_MANIFEST`. Everything else here runs as-is.
//
// We keep full control of push notifications and notification clicks,
// while Workbox handles all the caching automatically.

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// ── Precache all build assets (injected by Workbox at build time) ─────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── App shell fallback for offline navigation ─────────────────────────────────
const handler = createHandlerBoundToURL("/index.html");
const navRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/, /^\/supabase/, /^\/__/],
});
registerRoute(navRoute);

// ── Runtime: network-first for Supabase ──────────────────────────────────────
registerRoute(
  ({ url }) => url.hostname.includes("supabase.co"),
  new NetworkFirst({
    cacheName: "supabase-api",
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })],
  })
);

// ── Runtime: cache-first for fonts ───────────────────────────────────────────
registerRoute(
  ({ url }) => url.hostname.includes("fonts.googleapis.com") ||
               url.hostname.includes("fonts.gstatic.com"),
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  })
);

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; }
  catch { data = { title: "ChurchTrakr", body: e.data ? e.data.text() : "" }; }

  e.waitUntil(
    self.registration.showNotification(data.title || "ChurchTrakr", {
      body:    data.body    || "",
      icon:    data.icon    || "/icons/icon-192.png",
      badge:   "/icons/icon-192.png",
      tag:     data.tag     || "churchtrakr",
      data:    data.data    || {},
      actions: data.actions || [],
      vibrate: [200, 100, 200],
      renotify: !!data.renotify,
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(wins => {
      for (const win of wins) {
        if (win.url.includes(self.location.origin)) {
          win.focus();
          win.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Skip waiting so new SW activates immediately ──────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});