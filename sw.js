// sw.js

// 🌟 修正点1: キャッシュ名をインクリメントして強制更新
const CACHE_NAME = 'houseplant-care-v2';
const urlsToCache = [
    './', // index.html
    'index.html',
    'style.css',
    'app.js',
    'data.js', 
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png',
    // 既存の画像ファイル
    'cordyline.jpg',
    'pachira.jpg',
    'monstera.jpg',
    'gajumaru.jpg',
    'sansevieria.jpeg',
    'dracaena.jpg',
    'schefflera.jpg',
    'yucca.jpg',
    'anthurium.jpg',
    'pothos.jpg',
    'alocasia.jpg',
    'indian_rubber.jpg',
    'everfresh.jpg',
    'croton.jpg',
    'coffee_tree.jpg',
    'ponytail_palm.jpg',
    'ficus_umbellata.jpg',
    'augusta.jpg',
    'staghorn_fern.jpg',
    'araucaria.jpg',
    // 🌟 修正点2: 新しい画像ファイルをキャッシュリストに追加
    'adenium.jpg.jpeg',
    'echeveria.jpg.jpeg'
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
