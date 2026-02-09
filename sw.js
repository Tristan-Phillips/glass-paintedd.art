const CACHE_NAME = 'paintedd-core-v5';
const OFFLINE_PAGE = '/404.html';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/gallery/index.html',
    '/universe/quickview/index.html',
    '/pallet/img/logo-circular.png',
    '/manifest.json',
    OFFLINE_PAGE // Pre-cache the error page
];

// 1. INSTALL: Cache App Shell + Offline Page
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. ACTIVATE: Cleanup old versions
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

// 3. FETCH: The Strategy
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    const isNavigation = e.request.mode === 'navigate';

    // STRATEGY A: Data (art.json) -> Network First, Fallback to Cache
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

    // STRATEGY B: Navigation (HTML) -> Network First, Fallback to 404
    // This ensures if they are offline, they get the custom 404 page
    if (isNavigation) {
        e.respondWith(
            fetch(e.request)
                .catch(() => {
                    return caches.match(e.request)
                        .then((cached) => {
                            // If page is cached, return it. If not, return 404 page.
                            return cached || caches.match(OFFLINE_PAGE);
                        });
                })
        );
        return;
    }

    // STRATEGY C: Images/Fonts -> Stale-While-Revalidate
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

    // STRATEGY D: Everything else (CSS/JS Shell) -> Cache First
    e.respondWith(
        caches.match(e.request).then((cached) => {
            return cached || fetch(e.request);
        })
    );
});