// Improved Service Worker for full offline functionality
const CACHE_NAME = 'level-tool-cache-v1';

// Files to cache - include ALL files needed for the app to work
const filesToCache = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './icons/icon-16x16.png',
  './icons/icon-32x32.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-167x167.png',
  './icons/icon-180x180.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// Install event - cache all necessary resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  
  // Perform install steps: precache all essential resources
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all files');
        return cache.addAll(filesToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete any old caches that aren't the current one
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event with network-first, falling back to cache strategy
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetch', event.request.url);
  
  event.respondWith(
    // Try network first
    fetch(event.request)
      .then(response => {
        // Clone the response since we need to use it twice
        const responseClone = response.clone();
        
        // Update the cache with the fresh version
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        
        return response;
      })
      .catch(() => {
        // Network failed, try the cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              // Return cached version if we have it
              return cachedResponse;
            }
            
            // If the request is for a page, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // Otherwise return a basic failure response
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle service worker updates
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
