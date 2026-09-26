// Service worker: keeps every file of the app on the device so prayer works
// with no signal. Bump VERSION (with js/version.js) on every release.

const VERSION = '1.0.0';
const CACHE = `btt-${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/views/today.css',
  './css/views/pray.css',
  './css/views/requests.css',
  './css/views/ebenezer.css',
  './css/views/journal.css',
  './css/views/learn.css',
  './css/views/settings.css',
  './js/theme-init.js',
  './js/app.js',
  './js/version.js',
  './js/router.js',
  './js/store.js',
  './js/dates.js',
  './js/dom.js',
  './js/schedule.js',
  './js/ics.js',
  './js/backup.js',
  './js/install.js',
  './js/data/categories.js',
  './js/data/scripture.js',
  './js/data/catechism.js',
  './js/data/standards.js',
  './js/data/guides.js',
  './js/data/psalter.js',
  './js/data/quotes.js',
  './js/views/today.js',
  './js/views/pray.js',
  './js/views/requests.js',
  './js/views/ebenezer.js',
  './js/views/journal.js',
  './js/views/learn.js',
  './js/views/settings.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('btt-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE })
        .then((cached) => cached || fetch(request))
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { cacheName: CACHE, ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      });
    }),
  );
});
