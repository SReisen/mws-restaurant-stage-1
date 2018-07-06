let siteCache = 'restaurant-sw-v2';
let siteCacheUrls = [
    '/',
    'index.html',
    'sw.js',
    'restaurant.html',
    'dist/css/styles-min.css',
    'manifest.json',
    'js/idb.js',
    'js/restaurant-review-min.js',
    'js/main.js',
    'js/restaurant_info.js',
    'icon/map-show.svg',
    'icon/map-hide.svg',
    'icon/no-pic.svg',
    'icon/heart.svg',
    'icon/icons-192.png',
    'icon/icons-512.png',
    'icon/favicon.ico'
    ];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(siteCache).then(function(cache) {
            return cache.addAll(siteCacheUrls);
        })
    );
});

self.addEventListener('fetch', function(e) {
    let reqUrl = new URL(e.request.url);
    if (reqUrl.origin === location.origin) {  
        // caches images without size informations
        if (reqUrl.pathname.startsWith('/images/')){
            // changed to length - 6 => .jpg is missing
           let imageUrl = reqUrl.toString().substr(0, reqUrl.toString().length-10).concat(".jpg");
            e.respondWith(

            caches.open(siteCache).then(function(cache) {   
                return cache.match(imageUrl).then(function(res) {
                    if (res)
                        return res; 
                 
                    //return caches.open(siteCache).then(function(cache) {
                    return fetch(e.request).then(function(nRes) {
                        cache.put(imageUrl, nRes.clone());
                        return nRes; 
                    })
                
                })
            })
            )

        }
        // ignores the URL appendix at the restaurant.html sites
        else if (reqUrl.pathname.startsWith('/restaurant.html')){
            e.respondWith(
                caches.match(e.request, {ignoreSearch: true}).then(function(res) {
                    if (res) return res;
                    return fetch(e.request)
                })

            )
        }
    
        else {e.respondWith(
            caches.match(e.request).then(function(res){
                if (res) return res;
                return fetch(e.request)
            })
        )
        }
    }
});



