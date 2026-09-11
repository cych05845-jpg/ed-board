/* 急診必看板 — Service Worker
   只快取程式外殼(index.html / 圖示),公告與文件一律走網路,確保永遠最新。 */
const CACHE = 'edboard-v1';
const SHELL = ['./', './index.html', './icon-192.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // 只處理讀取
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // 後端 API、雲端硬碟一律走網路

  // 網路優先:有網路就拿最新的,沒網路才用快取(離線時仍看得到外殼)
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
