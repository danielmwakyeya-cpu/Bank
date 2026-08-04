// Bank Nkhonde service worker
// IMPORTANT: bump CACHE_VERSION any time index.html (or any cached file) changes,
// otherwise returning users will keep seeing the old cached version.
const CACHE_VERSION = 'nkhonde-v4';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never intercept any Google/Firebase API request — always go live for
  // real-time data. Broadened to catch Firestore's WebChannel/long-polling
  // connections too, not just the obvious domain names.
  if (url.includes('googleapis.com') || url.includes('firebaseapp.com') || url.includes('gstatic.com')) {
    return;
  }

  // Only handle our own same-origin files. Leave every other request
  // (trackers, extensions, third-party pixels) to the browser as normal —
  // this service worker has no business touching them.
  if (new URL(url).origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(
        () => new Response('Offline', { status: 503, statusText: 'Offline' })
      );
    })
  );
});

