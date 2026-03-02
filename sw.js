// sw.js

// キャッシュ名の定義
const CACHE_NAME = 'houseplant-care-v21';

// キャッシュするアセットのリスト
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './data.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
    './pachira.jpg',
    './monstera.jpg',
    './gajumaru.jpg',
    './sansevieria.jpeg',
    './dracaena.jpg',
    './schefflera.jpg',
    './yucca.jpg',
    './anthurium.jpg',
    './pothos.jpg',
    './alocasia.jpg',
    './indian_rubber.jpg',
    './everfresh.jpg',
    './croton.jpg',
    './coffee_tree.jpg',
    './ponytail_palm.jpg',
    './ficus_umbellata.jpg',
    './augusta.jpg',
    './staghorn_fern.jpg',
    './araucaria.jpg',
    './adenium.jpg.jpeg',
    './echeveria.jpg.jpeg',
    './cordyline.jpg',
    './kalanchoe.jpg',
    './maranta.jpg',
    './sophora.jpg',
    './white_ghost.jpg', 
    './peperomia.jpg'    
];

// Service Worker インストール時
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Service Worker アクティベート時
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

// フェッチ要求
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
