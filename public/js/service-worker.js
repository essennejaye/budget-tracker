const APP_PREFIX = 'BudgetTracker';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = 'data_cache_v1';

const FILES_TO_CACHE = [
    // '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/index.js',
    "/icons/icon-72x72.png",
    "/icons/icon-96x96.png",
    "/icons/icon-128x128.png",
    "/icons/icon-144x144.png",
    "/icons/icon-152x152.png",
    "/icons/icon-192x192.png",
    "/icons/icon-384x384.png",
    "/icons/icon-512x512.png"

]

self.addEventListener('install', function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('installing cache : ' + CACHE_NAME)
                return cache.addAll(FILES_TO_CACHE)
            })
    );
});

self.addEventListener('activate', function (evt) {
    evt.waitUntil(
        caches.keys()
            .then(keyList => {
                let cacheKeepList = keyList.filter(key => {
                    return key.indexOf(APP_PREFIX)
                })
                cacheKeepList.push(CACHE_NAME);
                return Promise.all(
                    keyList.map((key, i) => {
                        if (cacheKeepList.indexOf(key) === -1) {
                            console.log('Removing old cache data ', + keyList[i]);
                            return caches.delete(keyList[i]);
                        }
                    })
                );
            })
    );
});

self.addEventListener('fetch', function (evt) {
    // cache all get requests to api routes
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then(cache => {
                    return fetch(evt.request)
                        .then(response => {
                            // If the response was good, clone it and store it in the cache.
                            // need clone because response is consumed by browser, 1 for browser, 1 for cache
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            // Network request failed, try to get it from the cache.
                            return cache.match(evt.request);
                        });
                })
                .catch(err => console.log(err))
        );
        return;
    }
    evt.respondWith(
        fetch(evt.request)
            .catch(() => {
                return caches.match(evt.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        } else if (evt.request.headers.get('accept').includes('text/html')) {
                            // return the cached home page for all requests for html pages
                            return caches.match('/');
                        }
                    });
            })
    );
});
