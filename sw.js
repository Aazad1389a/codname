const CACHE = 'codname-shell-v10';
const ASSETS = [
  './', './index.html', './css/style.css', './css/menu-reference.css', './css/effects.css', './css/menu-visuals.css',
  './js/main.js', './js/ui.js', './js/ui-fixes.js', './js/install-entry.js', './js/github-auth-ui.js', './js/menu-visuals.js', './js/workspace.js', './js/auth.js', './js/game.js', './js/cards.js', './js/multiplayer.js', './js/player.js', './js/supabase.js',
  './manifest.webmanifest', './assets/logo.svg', './assets/logo-heavy.svg', './assets/favicon.svg', './assets/icon-192.svg', './assets/icon-512.svg', './assets/apple-touch-icon.svg', './assets/hero.svg', './assets/menu-hero.svg', './assets/avatar-agent.svg'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  const isAppCode=url.origin===self.location.origin && (/\.(?:html|js|css|svg|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/'));
  if(isAppCode){
    event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;}).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).catch(()=>caches.match('./index.html'))));
});
