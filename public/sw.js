const CACHE = 'daryapedia-shell-v1';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(['/icon.svg','/manifest.webmanifest']))); self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Never cache authenticated API responses, profiles, conversations or health data.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (/\.(woff2?|svg|css|js)$/.test(url.pathname)) event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request); if (cached) return cached;
    const response = await fetch(event.request); if (response.ok) cache.put(event.request, response.clone()); return response;
  }));
});
