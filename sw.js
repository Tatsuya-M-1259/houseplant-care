// sw.js

// 🌟 更新: キャッシュバージョンを v12 に更新 (app.jsの修正を反映させるため)
const CACHE_NAME = 'houseplant-care-v12'; 
const SORTABLE_CDN = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';

const CORE_ASSETS = [
    './', // index.html
    'index.html',
    'style.css',
    'app.js',
    'data.js', 
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png',
    SORTABLE_CDN 
];

// SVGプレースホルダー定義 (画像読み込み失敗時に表示)
const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#f0f0f0"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#888">
    Image Offline
  </text>
</svg>`;

// インストールイベント: コアアセットのプリロード
self.addEventListener('install', (event) => {
    self.skipWaiting(); // 即時有効化

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: コアアセットをプリロードしました。');
                return cache.addAll(CORE_ASSETS);
            })
    );
});

// フェッチイベント: キャッシュ戦略の適用
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const path = url.pathname;

    // 画像ファイル（.jpg, .jpeg, .png）の動的キャッシュ戦略
    if (path.match(/\.(jpg|jpeg|png)$/i)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    return response || fetch(event.request)
                        .then((networkResponse) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        })
                        // 🌟 修正: オフライン等で画像取得に失敗した場合はSVGプレースホルダーを返す
                        .catch(() => {
                            return new Response(PLACEHOLDER_SVG, {
                                headers: { 'Content-Type': 'image/svg+xml' }
                            });
                        });
                });
            })
        );
        return; 
    }

    // data.js の SWR 戦略
    if (path.includes('data.js')) {
        event.respondWith(staleWhileRevalidate(event.request));
    } 
    // 外部CDN (SortableJS) もキャッシュ優先で返す
    else if (event.request.url === SORTABLE_CDN || CORE_ASSETS.includes(path)) {
         event.respondWith(caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }));
    }
    else {
        // Cache-First戦略をコアアセットに適用
        event.respondWith(caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }));
    }
});

// SWR戦略のヘルパー関数
function staleWhileRevalidate(request) {
    return caches.match(request).then((cacheResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
            });
            return networkResponse;
        }).catch(error => {
            console.warn('SWR: ネットワークリクエスト失敗。', error);
        });
        return cacheResponse || fetchPromise;
    });
}

// アクティベートイベント: 古いキャッシュのクリーンアップ
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === self.location.origin + self.location.pathname && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(self.location.origin + self.location.pathname);
            }
        })
    );
});
