// Service Worker Manual para PWA - Frontend Business Suite
// Versión: 1.1.0 - Generado: 2026-06-28T03:37:38.326Z
const CACHE_NAME = 'frontend-business-suite-v1-1-0';
const IMAGE_CACHE = 'frontend-business-suite-images-v1-1-0';

// Archivos estáticos para cachear en la instalación (solo assets básicos)
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/images/icons/android-chrome-192x192.png',
  '/images/icons/android-chrome-512x512.png'
];

// Instalar el service worker y cachear archivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el service worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Eliminar RUNTIME_CACHE si existe y otros cachés antiguos
              return cacheName !== CACHE_NAME &&
                cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estrategia de caché: Solo para imágenes y assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // No cachear peticiones a APIs, autenticación, webpack o hot-updates
  if (url.pathname.includes('/api/') ||
    url.pathname.includes('/_next/webpack') ||
    url.pathname.includes('hot-update')) {
    return;
  }

  // NO cachear páginas ni recursos dinámicos - Network Only
  // Solo permitir caché para imágenes y assets estáticos de Next.js

  // Estrategia para imágenes: Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Estrategia para assets estáticos de Next.js: Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Para todo lo demás (páginas, fetchings, recursos dinámicos): Network Only (sin caché)
  event.respondWith(fetch(request));
});

// Estrategia Cache First: Busca en caché primero, luego en red
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Error in cacheFirstStrategy:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Sin conexión', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}


// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

