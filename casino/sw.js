/* Offline support: every file the app needs is cached on first visit. Files are served from the
   cache and refreshed in the background, so a new version shows up on the next launch.
   Bump VERSION when the file list changes. */
const VERSION = 'high-roller-v39';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/reality.css', 'css/bedsit.css', 'js/vendor/three.min.js', 'js/vendor/reflector.js', 'js/bedsit.js', 'js/reality/isoart.js', 'js/reality/engine.js', 'js/reality/games.js', 'js/reality/world.js', 'js/reality/story.js', 'js/reality/bottle.js', 'js/reality/demon.js', 'js/reality/photo.js', 'js/reality/wallet.js', 'js/reality/shifts.js', 'js/reality/people.js', 'js/reality/pub.js', 'js/reality/life.js',
  'js/core.js', 'js/poker.js', 'js/paytables.js', 'js/rtp.js', 'js/ui.js', 'js/state.js', 'js/career.js',
  'js/games/blackjack.js', 'js/games/uth.js', 'js/games/stud.js', 'js/games/baccarat.js',
  'js/games/craps.js', 'js/games/roulette.js', 'js/games/crazy4.js', 'js/voice.js', 'js/npcs.js', 'js/meta.js', 'js/portraits.js', 'js/looks.js', 'js/gameart.js', 'js/spotter.js', 'js/postcards.js', 'js/ambient.js', 'js/music.js', 'js/mood.js', 'js/duel.js', 'js/mystery.js', 'js/whispers.js', 'js/relations.js', 'js/fragments.js', 'js/afterstory.js', 'js/salquest.js', 'js/holdem.js', 'js/darts.js', 'js/slotart.js', 'js/slots.js', 'js/world.js', 'js/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
