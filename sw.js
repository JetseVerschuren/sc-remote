// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
const cacheName = 'lolidk';
const appShellFiles = [
  './',
  'style.css',
  'manifest.json',
  'fonts/roboto.css',
  'fonts/Roboto-Regular.ttf',
  'fonts/Roboto-Medium.ttf',
  'icons/logo.svg',
  'icons/logo192.png',
  'icons/logo512.png',
];

self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(appShellFiles);
  })());
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    if (r) { return r; }
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    const response = await fetch(e.request);
    return response;
  })());
});
