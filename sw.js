// sw.js
// 更新を反映させるため、バージョン番号を以前のものより上げてください（例: v24 -> v25）
const CACHE_NAME = 'houseplant-care-v25'; 

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

// 1. Service Worker インストール時: 必要なファイルをすべてキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all core assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // 新しいSWを待機させず即座にアクティブにする
    );
});

// 2. Service Worker アクティベート時: 旧バージョンのキャッシュを完全に削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // すべてのタブで即座に新しいSWの制御を開始
    );
});

// 3. フェッチ要求（ネットワーク優先、失敗時にキャッシュを使用するハイブリッド型）
self.addEventListener('fetch', (event) => {
    // 外部URL（Google Fonts等）は除外
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // キャッシュがあればそれを返しつつ、背後でネットワークから最新版を取得
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                // 有効なレスポンスでなければそのまま返す
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // 新しく取得したリソース（画像など）をキャッシュに追加
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // 完全オフライン時の挙動が必要な場合はここに記述
            });
        })
    );
});
