// sw.js

// バージョンを更新することでブラウザに新着を知らせ、キャッシュを刷新します
const CACHE_NAME = 'houseplant-care-v2026-03-02-v4'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './style.css',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// インストール時にアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // 新しいサービスワーカーをすぐに有効化
      return self.skipWaiting();
    })
  );
});

// アクティベート時に古いキャッシュを自動削除
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
    }).then(() => {
      // 全クライアントを新しいSWに即座に切り替え
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
