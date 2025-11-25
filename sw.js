// sw.js

const CACHE_NAME = 'houseplant-care-v7'; // 🌟 更新: バージョンをインクリメント
// 🌟 修正: バージョンを固定して安全性を確保
const SORTABLE_CDN = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';

const CORE_ASSETS = [
    './', // index.html
    'index.html',
    'style.css',
    'app.js',
    'data.js', // 🌟 追加: data.js もコアアセットとして明示的にキャッシュ推奨
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png',
    SORTABLE_CDN // 🌟 重要: 外部CDNのライブラリもキャッシュしてオフライン対応させる
];

// インストールイベント: コアアセットのプリロード
self.addEventListener('install', (event) => {
    // 🌟 追加: 更新時に待機状態をスキップして即時有効化させる
    self.skipWaiting();

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

    // 🌟 画像ファイル（.jpg, .jpeg, .png）の動的キャッシュ戦略
    if (path.match(/\.(jpg|jpeg|png)$/i)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    // キャッシュにあればそれを返す
                    // なければネットワークから取得してキャッシュに保存
                    return response || fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return; // 処理終了
    }

    // data.js の SWR 戦略
    if (path.includes('data.js')) {
        event.respondWith(staleWhileRevalidate(event.request));
    } 
    // 🌟 外部CDN (SortableJS) もキャッシュ優先で返す
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
