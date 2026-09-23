// EOS Traction Tool — service worker (v5.27.0, 2026-09-23)
//
// NOTIFICATIONS ONLY. There is deliberately NO fetch handler here: this worker
// never caches index.html, styles.css or anything else. The tool's whole
// "which version is this phone on?" story (the stale-build strip, the ?v=
// styles link, the drift check) assumes the network is the source of truth,
// and a caching worker is exactly how a phone ends up silently serving a
// three-week-old build. If someone adds a fetch handler here later, they are
// taking on that problem knowingly.
//
// What it does: receives a Web Push from the "push" Edge Function, shows it,
// and opens (or focuses) the tool when the notification is tapped.

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
    var d = {};
    try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
    var title = d.title || 'EOS Traction Tool';
    var opts = {
        body: d.body || '',
        icon: 'icons/icon-192.png',
        badge: 'icons/badge-96.png',
        data: { url: d.url || './' }
    };
    // One tag per kind (eos-brief, eos-rule3, eos-test) so a re-send replaces
    // the earlier notification instead of stacking a second one.
    if (d.tag) { opts.tag = d.tag; opts.renotify = true; }
    e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    var raw = (e.notification.data && e.notification.data.url) || './';
    var url;
    try { url = new URL(raw, self.location.href).href; } catch (err) { url = self.location.href.replace(/sw\.js.*$/, ''); }
    var bare = function (u) { return String(u).split('#')[0].split('?')[0].replace(/index\.html$/, ''); };
    e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        for (var i = 0; i < list.length; i++) {
            if (bare(list[i].url) === bare(url) && 'focus' in list[i]) return list[i].focus();
        }
        return self.clients.openWindow(url);
    }));
});

// The browser rotated the subscription behind our back (rare; happens after a
// long offline stretch or a browser update). The page re-registers on its next
// open — pushRefreshBand() notices the mismatch — so nothing to do here except
// avoid throwing.
self.addEventListener('pushsubscriptionchange', function () { });
