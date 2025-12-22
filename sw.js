const CACHE_NAME = 'lumina-cache-v2';

// Core "Shell" assets to pre-cache immediately
// Using relative paths ./ to ensure they resolve relative to the SW location
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/locales/en.json',
  './assets/locales/es.json',
  './assets/prompts/builder_system.md',
  './assets/prompts/refactor_system.md',
  './assets/prompts/protocol.md',
  './assets/prompts/answers.md'
];

// External Domains to cache (CDNs for Monaco, SurrealDB, React, etc.)
const CACHE_DOMAINS = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com', // Monaco, Prism
  'esm.sh',               // Modules
  'aistudiocdn.com',      // React
  'cdn.jsdelivr.net'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
        // Use Promise.allSettled to ensure SW installs even if one non-critical file is missing (404)
        return Promise.allSettled(
            PRECACHE_ASSETS.map(url => 
                cache.add(url).catch(e => console.warn('[SW] Failed to precache', url, e))
            )
        );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Determine if we should cache this request
  const isLocal = url.origin === self.location.origin;
  const isAllowedCDN = CACHE_DOMAINS.some(d => url.hostname.includes(d));

  if (isLocal || isAllowedCDN) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        // Network Fetch (Stale-While-Revalidate Strategy)
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if valid response (allow opaque responses for CDNs)
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((e) => {
           // Network failed.
           // If navigation request (e.g. user refreshing page offline), return index.html fallback
           if (event.request.mode === 'navigate') {
               return cache.match('./index.html');
           }
           throw e;
        });

        // Return cached if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
  }
});