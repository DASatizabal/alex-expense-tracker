// Service Worker for Alex's Expense Tracker
const CACHE_NAME = 'expense-tracker-v2';
const ASSETS_TO_CACHE = [
    '/alex-expense-tracker/',
    '/alex-expense-tracker/index.html',
    '/alex-expense-tracker/css/styles.css',
    '/alex-expense-tracker/js/config.js',
    '/alex-expense-tracker/js/encryption.js',
    '/alex-expense-tracker/js/sheets-api.js',
    '/alex-expense-tracker/js/i18n.js',
    '/alex-expense-tracker/js/app.js',
    '/alex-expense-tracker/icons/icon-192.svg',
    '/alex-expense-tracker/icons/icon-512.svg',
    '/alex-expense-tracker/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Google Apps Script API calls (always need fresh data)
    if (event.request.url.includes('script.google.com')) {
        return;
    }

    // Skip CDN resources (Tailwind, fonts, Lucide) - let browser handle caching
    if (event.request.url.includes('cdn.tailwindcss.com') ||
        event.request.url.includes('fonts.googleapis.com') ||
        event.request.url.includes('fonts.gstatic.com') ||
        event.request.url.includes('unpkg.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response before caching
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/alex-expense-tracker/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});
