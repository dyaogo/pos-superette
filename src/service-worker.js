/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

clientsClaim();

// Precache les assets statiques
precacheAndRoute(self.__WB_MANIFEST);

// Navigation fallback
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Stratégie pour les API - NetworkFirst avec fallback cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Stratégie pour les images - CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
      }),
    ],
  })
);

// Stratégie pour les fonts et CSS - CacheFirst
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 an
      }),
    ],
  })
);

// Background Sync pour les opérations POST/PUT/DELETE qui échouent
const bgSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while (entry = await queue.shiftRequest()) {
      try {
        await fetch(entry.request);
        console.log('Replay successful for request', entry.request.url);
      } catch (error) {
        console.error('Replay failed for request', entry.request.url, error);
        // Re-queue the request
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Enregistrer les routes qui nécessitent background sync
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE'),
  new NetworkFirst({
    cacheName: 'api-mutations',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    request.method === 'PUT',
  new NetworkFirst({
    cacheName: 'api-mutations',
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    request.method === 'DELETE',
  new NetworkFirst({
    cacheName: 'api-mutations',
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
);

// Messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear cache on demand
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Notification de mise à jour disponible
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
