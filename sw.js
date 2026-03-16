// sw.js
const CACHE_NAME = 'houseplant-care-v24'; // バージョンを v24 に更新

// インストール時に確実にキャッシュすべき「コアアセット」
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './data.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png'
];

// Service Worker インストール時: コアアセットをキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // 新しいSWを即座に待機状態へ
    );
});

// Service Worker アクティベート時: 古いキャッシュの削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName); // 旧バージョンのキャッシュを破棄
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // 制御を即座に開始
    );
});

// フェッチ要求（動的キャッシュ戦略）
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache); // 新規アセット（画像等）を動的に保存
                });

                return response;
            }).catch(() => {
                // オフライン時のエラーハンドリング
            });
        })
    );
});
