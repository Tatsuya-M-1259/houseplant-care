// sw.js

const CACHE_NAME = 'houseplant-care-v22'; // バージョンアップ

// インストール時に確実にキャッシュすべき「コアアセット」（App Shell）
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

// Service Worker インストール時
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // コアアセットのみを登録。画像が404でもインストールが失敗しないようにする
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Service Worker アクティベート時（古いキャッシュの削除）
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

// フェッチ要求（動的キャッシュ戦略）
self.addEventListener('fetch', (event) => {
    // 同一オリジンのリクエストのみ処理
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // キャッシュがあればそれを返す
            if (cachedResponse) {
                return cachedResponse;
            }

            // キャッシュがない場合はネットワークから取得し、同時にキャッシュに保存（動的キャッシュ）
            return fetch(event.request).then((response) => {
                // 有効なレスポンス（画像等）のみキャッシュに保存
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // オフラインかつキャッシュなしの場合のフォールバック処理などが必要な場合はここに記述
            });
        })
    );
});
