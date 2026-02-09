const CACHE_NAME = 'paintedd-core-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/gallery/index.html',
    '/universe/quickview/index.html',
    '/pallet/img/logo-circular.png',
    '/manifest.json'
];

// 1. INSTALL: Cache the "App Shell" immediately
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting(); // Take over immediately
});

// 2. ACTIVATE: Clean up old versions
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
    return self.clients.claim();
});

// 3. FETCH: The Hybrid Strategy
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // STRATEGY A: Data (art.json) -> Network First, Fallback to Cache
    // We always want the latest art list. If offline, show the last known list.
    if (url.pathname.includes('art.json')) {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // STRATEGY B: External Assets (FontAwesome/Images) -> Stale-While-Revalidate
    // Serve fast from cache, update in background.
    if (e.request.destination === 'image' || e.request.destination === 'script' || url.hostname.includes('fontawesome')) {
        e.respondWith(
            caches.match(e.request).then((cached) => {
                const networkFetch = fetch(e.request).then((res) => {
                    caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
                    return res;
                });
                return cached || networkFetch;
            })
        );
        return;
    }

    // STRATEGY C: Core App Shell -> Cache First
    // The HTML/CSS structure rarely changes, serve it instantly.
    e.respondWith(
        caches.match(e.request).then((cached) => {
            return cached || fetch(e.request);
        })
    );
});