let siteCache = 'restaurant-sw-v2';
let siteCacheUrls = [
    '/',
    'index.html',
    'sw.js',
    'restaurant.html',
    'css/styles.css',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'data/restaurants.json'
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
        // caches images without size information 
        if (reqUrl.pathname.startsWith('/images/')){
           let imageUrl = reqUrl.toString().substr(0, reqUrl.toString().length-10).concat(".jpg");
           console.log(imageUrl);
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



