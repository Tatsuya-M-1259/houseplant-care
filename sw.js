// sw.js

// キャッシュ名の定義（バージョンアップを認識させるため v18 に更新）
const CACHE_NAME = 'houseplant-care-v18';

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
    './kalanchoe.jpg' // カランコエの画像ファイル名を追加
];

// プレースホルダー画像 (オフライン/画像未準備時に使用)
const PLACEHOLDER_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#eee"/>
  <text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="#999" text-anchor="middle" dy=".3em">Image Offline</text>
</svg>
`;

// Service Worker インストール時
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('V18 Cache: Fetching and caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            // 待機状態をスキップして、新しいSWをすぐにアクティブにする
            .then(() => self.skipWaiting())
    );
});

// Service Worker アクティベート時（古いキャッシュを即時削除）
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        // アクティブになった瞬間からすべてのクライアントを制御下に置く
        .then(() => self.clients.claim())
    );
});

// フェッチ要求に対するレスポンス戦略
self.addEventListener('fetch', (event) => {
    // 外部APIなどへのリクエストはキャッシュしない
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュがあればそれを返す (Stale-while-revalidate戦略)
                if (response) {
                    fetch(event.request).then((newResponse) => {
                        if (newResponse && newResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, newResponse);
                            });
                        }
                    });
                    return response;
                }

                // キャッシュがなければネットワークから取得
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        if (event.request.destination === 'image') {
                            return new Response(PLACEHOLDER_SVG, {
                                headers: { 'Content-Type': 'image/svg+xml' }
                            });
                        }
                    }
                    return networkResponse;
                }).catch(() => {
                    if (event.request.destination === 'image') {
                        return new Response(PLACEHOLDER_SVG, {
                            headers: { 'Content-Type': 'image/svg+xml' }
                        });
                    }
                });
            })
    );
});
