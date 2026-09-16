const CACHE = 'codname-shell-v35';
const ASSETS = [
  './','./index.html','./404.html','./css/style.css','./css/menu-reference.css','./css/effects.css','./js/menu-visuals.css',
  './js/main.js','./js/pre.js','./js/ios-fix.js','./js/ui.js','./js/ui-fixes.js','./js/install-entry.js','./js/github-auth-ui.js','./js/menu-visuals.js','./js/menu-lightweight.js','./js/mobile-clean.js','./js/mobile-scroll-final.js','./js/desktop-scroll-final.js','./js/mobile-game-fix.js','./js/mobile-game-repair.js','./js/lobby-mode-control.js','./js/visual-motion.js','./js/gold-card-fix.js','./js/settings-cleanup.js','./js/leader-team-controls.js','./js/team-roles.js','./js/lobby-format-guard.js','./js/workspace.js','./js/workspace-v2.js','./js/clue-system.js','./js/halloween-event.js','./js/auth.js','./js/game.js','./js/cards.js','./js/multiplayer.js','./js/player.js','./js/supabase.js',
  './manifest.webmanifest','./assets/logo.svg','./assets/logo-heavy.svg','./assets/favicon.svg','./assets/icon-192.svg','./assets/icon-512.svg','./assets/apple-touch-icon.svg','./assets/hero.svg','./assets/menu-hero.svg','./assets/avatar-agent.svg'
];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isAppCode = url.origin === self.location.origin && (/\\.(?:html|js|css|svg|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/'));
  if (isAppCode) {
    event.respondWith(fetch(request, { cache: 'no-store' }).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).catch(() => caches.match('./index.html'))));
});
