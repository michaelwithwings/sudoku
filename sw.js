// Service worker: makes the app work offline.
//
// This is a template. When you run `yarn build`, the list of files and a
// version number are filled in (see vite.config.ts) and the result is saved
// as dist/sw.js.

const VERSION = "b1170dc4aacf"
const FILES = ["app.webmanifest","apple-touch-icon.png","assets/index-B0c8-Euk.css","assets/index-CYMR11zU.js","assets/puzzle.worker-Cl9Fbpo7.js","favicon.svg","icon-192.png","icon-512.png","icon-maskable-512.png","index.html"]
const CACHE = `mikedoku-${VERSION}`

// Install: download every file of this version, then take over straight away.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  )
})

// Activate: delete files from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mikedoku-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Opening the app: try the network first (to pick up updates), but fall
    // back to the saved copy if offline or the network is slow.
    event.respondWith(networkFirst(request))
    return
  }

  // The app's install details: always ask the network first, so the phone
  // never installs from an out-of-date copy.
  if (request.url.endsWith('.webmanifest')) {
    event.respondWith(fetch(request).catch(() => caches.match(request, { ignoreVary: true })))
    return
  }

  // Everything else: saved copy first, network if it isn't saved.
  // ignoreVary: some hosts send "Vary" headers that would otherwise stop the
  // saved copy from matching.
  event.respondWith(caches.match(request, { ignoreVary: true }).then((saved) => saved || fetch(request)))
})

async function networkFirst(request) {
  const saved = () => caches.match(new URL('index.html', self.registration.scope).href, { ignoreVary: true })
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ])
    return response.ok ? response : (await saved()) || response
  } catch {
    return (await saved()) || Response.error()
  }
}
