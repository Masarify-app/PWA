// A service worker that removes itself. The earlier web app (Kotlin/Wasm, until 2026-11) registered two workers at
// this folder's scope (/PWA/): coi-serviceworker.js (cross-origin isolation headers on every response, and a cache of
// the old app) and firebase-messaging-sw.js (web push). The app needs neither: its database needs no cross-origin
// isolation, and web push comes back with Task 10e. A browser that still has one checks its script for an update on
// a visit, finds this one (served at both addresses) and installs it, which:
// 1. takes over from the old worker at once (skipWaiting), so the open pages are this worker's;
// 2. unregisters, so no worker controls this scope once those pages are gone;
// 3. deletes the caches the old worker filled;
// 4. reloads the open pages, which the network then serves without the old headers.
// It handles no fetch: nothing is cached or rewritten. Until Task 10e ships a real firebase-messaging-sw.js, both
// addresses serve this same file (webApp SiteTest checks it). Guide section 4.15, checklist 76.
self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            await self.registration.unregister();
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
            const windows = await self.clients.matchAll({ type: "window" });
            await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => undefined)));
        })(),
    );
});
