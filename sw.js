// sw.js

// キャッシュ名の定義（バージョンアップ時に変更する）
const CACHE_NAME = 'houseplant-care-v18'; // v17からv18へ変更

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
    './cordyline.jpg'
    // ※ 新規追加した kalanchoe.jpg を追加しても良いですが、
    // ファイルがない場合はエラーになるため、画像ファイルを用意してから追記してください。
];

// プレースホルダー画像 (オフライン時に使用)
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
                console.log('Opened cache');
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
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
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
                // キャッシュがあればそれを返す
                if (response) {
                    // バックグラウンドで最新版を取得してキャッシュを更新する (Stale-while-revalidate)
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
                    // 画像ファイルへのリクエストが失敗した場合の処理
                    if (!networkResponse || networkResponse.status !== 200) {
                        if (event.request.destination === 'image') {
                            return new Response(PLACEHOLDER_SVG, {
                                headers: { 'Content-Type': 'image/svg+xml' }
                            });
                        }
                    }
                    return networkResponse;
                }).catch(() => {
                    // オフラインかつキャッシュなしの場合
                    if (event.request.destination === 'image') {
                        return new Response(PLACEHOLDER_SVG, {
                            headers: { 'Content-Type': 'image/svg+xml' }
                        });
                    }
                });
            })
    );
});
