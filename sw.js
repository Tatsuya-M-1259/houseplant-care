// sw.js

const CACHE_NAME = 'houseplant-care-v3'; // キャッシュバージョンを更新
const CORE_ASSETS = [
    './', // index.html
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'icon-192x192.png',
    'icon-512x512.png',
    // 画像ファイル...
    'cordyline.jpg', 'pachira.jpg', 'monstera.jpg', 'gajumaru.jpg', 'sansevieria.jpeg', 'dracaena.jpg', 
    'schefflera.jpg', 'yucca.jpg', 'anthurium.jpg', 'pothos.jpg', 'alocasia.jpg', 'indian_rubber.jpg', 
    'everfresh.jpg', 'croton.jpg', 'coffee_tree.jpg', 'ponytail_palm.jpg', 'ficus_umbellata.jpg', 
    'augusta.jpg', 'staghorn_fern.jpg', 'araucaria.jpg', 'adenium.jpg.jpeg', 'echeveria.jpg.jpeg'
];
const DATA_ASSETS = ['data.js'];

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
    const path = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

    if (DATA_ASSETS.includes(path)) {
        // 🌟 SWR (Stale-While-Revalidate) 戦略を data.js に適用
        event.respondWith(staleWhileRevalidate(event.request));
    } else {
        // Cache-First戦略をコアアセットと画像に適用
        event.respondWith(caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }));
    }
});

// SWR戦略のヘルパー関数
function staleWhileRevalidate(request) {
    return caches.match(request).then((cacheResponse) => {
        // ネットワークリクエストを開始
        const fetchPromise = fetch(request).then((networkResponse) => {
            // ネットワークレスポンスをキャッシュに保存
            caches.open(CACHE_NAME).then((cache) => {
                // clone() はレスポンスを消費せずにキャッシュするための必須処理
                cache.put(request, networkResponse.clone());
            });
            return networkResponse;
        }).catch(error => {
            console.warn('SWR: ネットワークリクエスト失敗。', error);
            // ネットワーク失敗時も、キャッシュがあればそれを返すため、ここではエラーを無視
        });

        // キャッシュがあればそれを即座に返す
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

// 🌟 PWA通知: pushイベントのリスナー (通知を受け取った際の処理)
// サーバーからのプッシュ通知を待機するロジックを実装します。
self.addEventListener('push', (event) => {
    // 実際の通知データ処理はここで行われます
    const title = '水やりリマインダー';
    const options = {
        body: event.data ? event.data.text() : '水やりの時間です。カルテを確認してください。',
        icon: 'icon-192x192.png',
        badge: 'icon-192x192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// 🌟 PWA通知: notificationclickイベントのリスナー (通知をクリックした際の処理)
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
