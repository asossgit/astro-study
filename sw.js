/* オフライン用キャッシュ。問題やアプリを更新したら VERSION を上げる */
const VERSION = 'astro-v2';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'data/subjects.js', 'data/q-humanities.js', 'data/q-social.js', 'data/q-math.js',
  'data/q-physics-chem.js', 'data/q-bio-earth.js', 'data/q-space.js',
  'data/q2-humanities.js', 'data/q2-social.js', 'data/q2-stem-a.js', 'data/q2-stem-b.js',
  'data/notes-hum.js', 'data/notes-soc.js', 'data/notes-stem.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// ネット優先・失敗したらキャッシュ（更新がすぐ反映され、圏外でも使える）
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
