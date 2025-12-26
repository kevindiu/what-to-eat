const CACHE_NAME = 'what-to-eat-v3.25=3.23';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './js/main.js',
    './js/api.js',
    './js/ui.js',
    './js/translations.js',
    './js/constants.js',
    './js/pwa.js',
    './js/utils.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching Assets');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - required for PWA installability
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
