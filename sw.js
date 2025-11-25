// sw.js

const CACHE_NAME = 'houseplant-care-v5'; // 🌟 修正: キャッシュバージョンを更新
const CORE_ASSETS = [
    './', // index.html
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png',
    // 🌟 コア画像（アセットとして必須なもののみ残す、他は動的キャッシュ）
    // 必要に応じてデフォルト画像やアイコンを追加
];

// インストールイベント: コアアセットのプリロード
self.addEventListener('install', (event) => {
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

    // data.js の SWR 戦略 (モジュール化してもファイル名が変わらなければ有効)
    if (path.includes('data.js')) {
        event.respondWith(staleWhileRevalidate(event.request));
    } else {
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

// 🌟 プッシュ通知イベントリスナーは、サーバーレス環境では発火しないため削除しました。
// 通知ロジックは app.js のクライアント側処理に移行しました。

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
