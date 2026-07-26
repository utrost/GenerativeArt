const CACHE_NAME = 'genart-pwa-v3';
const APP_SHELL = [
  '/genart/',
  '/genart/mobile.html',
  '/genart/manifest.webmanifest',
  '/genart/icons/icon-192.png',
  '/genart/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

function isGenArtRequest(request) {
  return new URL(request.url).pathname.startsWith('/genart/');
}

function isAppShellRequest(request) {
  const path = new URL(request.url).pathname;
  return request.mode === 'navigate'
    || path === '/genart/'
    || path === '/genart/index.html'
    || path === '/genart/mobile.html';
}

function putInCache(request, response) {
  if (!response || !response.ok || !isGenArtRequest(request)) return Promise.resolve();

  return caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
}

function networkFirst(request) {
  return fetch(request)
    .then((networkResponse) => {
      putInCache(request, networkResponse);
      return networkResponse;
    })
    .catch(() => caches.match(request));
}

function cacheFirst(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) return cachedResponse;

    return fetch(request).then((networkResponse) => {
      putInCache(request, networkResponse);
      return networkResponse;
    });
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !isGenArtRequest(event.request)) return;

  if (isAppShellRequest(event.request)) {
    return event.respondWith(networkFirst(event.request));
  }

  event.respondWith(cacheFirst(event.request));
});
