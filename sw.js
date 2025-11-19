// sw.js

const CACHE_NAME = 'houseplant-care-v1';
const urlsToCache = [
    './', // index.html
    'index.html',
    'style.css',
    'app.js',
    'data.js',
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png'
    // 注: 植物の個別画像（.jpg/.jfif）はキャッシュ戦略を複雑にするため、ここではPWAのインストール要件を満たすコアファイルのみを対象とします。
];

// インストールイベント: キャッシュの作成とコアアセットの追加
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: キャッシュを開き、コアファイルをプリロードしました。');
                return cache.addAll(urlsToCache);
            })
    );
});

// フェッチイベント: キャッシュからリソースを提供 (Cache-First戦略)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュに見つかったらそれを返す
                if (response) {
                    return response;
                }
                // キャッシュになければネットワークから取得
                return fetch(event.request);
            })
    );
});

// アクティベートイベント: 古いキャッシュのクリーンアップ
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // 不要なキャッシュを削除
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
