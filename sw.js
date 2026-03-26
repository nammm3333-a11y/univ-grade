// =============================================
// 대학 입시 등급 조회 - Service Worker
// =============================================

const CACHE_NAME = 'univ-grade-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/xlsx/dist/xlsx.full.min.js'
];

// ── 설치: 핵심 파일 캐싱 ──────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 캐시 설치 중...');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] 일부 리소스 캐시 실패 (무시):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── 활성화: 구버전 캐시 삭제 ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] 구버전 캐시 삭제:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache First → Network Fallback ────
self.addEventListener('fetch', event => {
  // POST 요청 등은 캐시 제외
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // 유효한 응답만 캐시에 저장
          if (
            response &&
            response.status === 200 &&
            response.type !== 'opaque'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // 오프라인 폴백: HTML 요청이면 index.html 반환
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
