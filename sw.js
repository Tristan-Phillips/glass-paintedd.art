// Minimal Service Worker to satisfy PWA requirements
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // Pass through all requests to the network (no complex caching yet)
    e.respondWith(fetch(e.request));
});