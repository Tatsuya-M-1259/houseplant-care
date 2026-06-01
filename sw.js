// sw.js
const CACHE_NAME = 'houseplant-care-v35';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './data.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
    'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js' // オフライン時のUI操作維持のためCDNを追加
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            // app.jsからのユーザー確認（SKIP_WAITING）を待つため、ここでの self.skipWaiting() は実行しません
    );
});

// app.js からの更新許可メッセージを受信して待機状態を解除
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 古いバージョンのキャッシュを削除
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName); 
                    }
                })
            );
        })
        .then(() => self.clients.claim()) 
    );
});

self.addEventListener('fetch', (event) => {
    // 同一オリジン、または指定したCDNからのリクエストのみ処理対象とする
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('cdn.jsdelivr.net')) {
        return;
    }

    // index.html, app.js, data.js などのコアファイルは常にネットワークを優先して最新か確認する
    const isCoreFile = event.request.url.endsWith('index.html') || 
                       event.request.url.endsWith('app.js') || 
                       event.request.url.endsWith('data.js') ||
                       event.request.mode === 'navigate';

    if (isCoreFile) {
        event.respondWith(
            fetch(event.request).then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // 画像や外部ライブラリ(CSS, CDN)などはキャッシュ優先で表示速度とオフライン動作を維持
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                // basic(同一オリジン)またはcors(CDN等のクロスオリジン)の正常なレスポンスのみキャッシュ
                if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return response;
            }).catch(() => {});
        })
    );
});
