// EOS Traction Tool — service worker (v5.30.1, 2026-09-24)
//
// NOTIFICATIONS ONLY (plus one named exception, the splash logo — see LOGO_CACHE
// below). The fetch handler touches exactly that one file and lets everything
// else fall through to the network: this worker never caches index.html,
// styles.css or any other app file. The tool's whole
// "which version is this phone on?" story (the stale-build strip, the ?v=
// styles link, the drift check) assumes the network is the source of truth,
// and a caching worker is exactly how a phone ends up silently serving a
// three-week-old build. If someone adds a fetch handler here later, they are
// taking on that problem knowingly.
//
// What it does: receives a Web Push from the "push" Edge Function, shows it,
// and opens (or focuses) the tool when the notification is tapped.
//
// v5.30.1: BUTTONS. The push payload may carry `actions`; each is shown as a
// button and its `url` opens on tap. Hans's three: "EOS Tool" (Today page),
// "Google Tasks", "Calendar". Android Chrome shows at most two or three and
// adds its own "Unsubscribe" — that one is Chrome's, not ours, and cannot be
// removed. The notification's own tap (not a button) opens the first action,
// or `url` when there are none.

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

// v5.31.1 — THE ONE DELIBERATE EXCEPTION to "caches nothing": the splash's animated
// Intelligrations logo is a 9.6 MB GIF that never changes, and the installed app
// shows it on every open. It is kept on the device after the first download.
// Scoped to that ONE file by exact path — nothing else passes through here, so the
// stale-build story above is untouched. If the logo is ever replaced, change the
// cache name below and the old copy is dropped on the next activate.
var LOGO_CACHE = 'eos-splash-logo-v1';
var LOGO_PATH = /\/icons\/intelligrations-logo\.gif$/;
self.addEventListener('fetch', function (e) {
    var url;
    try { url = new URL(e.request.url); } catch (err) { return; }
    if (e.request.method !== 'GET' || !LOGO_PATH.test(url.pathname)) return;   // everything else: the network, untouched
    e.respondWith(caches.open(LOGO_CACHE).then(function (cache) {
        return cache.match(e.request).then(function (hit) {
            if (hit) return hit;
            return fetch(e.request).then(function (resp) {
                if (resp && resp.ok) cache.put(e.request, resp.clone());
                return resp;
            });
        });
    }));
});
self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('eos-splash-logo-') === 0 && k !== LOGO_CACHE; }).map(function (k) { return caches.delete(k); }));
    }));
});

self.addEventListener('push', function (e) {
    var d = {};
    try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
    var title = d.title || 'EOS Traction Tool';
    var actions = Array.isArray(d.actions) ? d.actions.slice(0, 3) : [];
    var opts = {
        body: d.body || '',
        icon: 'icons/icon-192.png',
        badge: 'icons/badge-96.png',
        data: { url: d.url || './', actions: actions }
    };
    if (actions.length) {
        opts.actions = actions.map(function (a, i) { return { action: 'a' + i, title: String(a.title || '').slice(0, 20) }; });
    }
    // One tag per kind (eos-brief, eos-rule3, eos-test) so a re-send replaces
    // the earlier notification instead of stacking a second one.
    if (d.tag) { opts.tag = d.tag; opts.renotify = true; }
    e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    var data = e.notification.data || {};
    var actions = Array.isArray(data.actions) ? data.actions : [];
    var raw = data.url || './';
    if (e.action) {
        var idx = parseInt(String(e.action).replace(/^a/, ''), 10);
        if (actions[idx] && actions[idx].url) raw = actions[idx].url;
    } else if (actions.length && actions[0].url) {
        raw = actions[0].url;
    }
    var url;
    try { url = new URL(raw, self.location.href).href; } catch (err) { url = self.location.href.replace(/sw\.js.*$/, ''); }
    var bare = function (u) { return String(u).split('#')[0].split('?')[0].replace(/index\.html$/, ''); };
    var ours = bare(url) === bare(self.location.href);
    e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        if (ours) {
            for (var i = 0; i < list.length; i++) {
                if (bare(list[i].url) === bare(url) && 'focus' in list[i]) {
                    // An open tool tab: bring it forward and send it to the page the button named.
                    if ('navigate' in list[i]) return list[i].navigate(url).then(function (w) { return w && w.focus(); });
                    return list[i].focus();
                }
            }
        }
        return self.clients.openWindow(url);
    }));
});

// The browser rotated the subscription behind our back (rare; happens after a
// long offline stretch or a browser update). The page re-registers on its next
// open — pushRefreshBand() notices the mismatch — so nothing to do here except
// avoid throwing.
self.addEventListener('pushsubscriptionchange', function () { });
