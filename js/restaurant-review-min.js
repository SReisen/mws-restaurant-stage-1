let condition;var newFavoritSelection;lazyLoad=(()=>{console.log("lazyload called "),[].forEach.call(document.querySelectorAll("img[data-src]"),function(e){e.setAttribute("src",e.getAttribute("data-src")),e.onload=function(){e.removeAttribute("data-src")}})}),window.addEventListener("load",function(){document.getElementById("status"),document.getElementById("log");function e(e){"online"==(condition=navigator.onLine?"online":"offline")&&sendAllOfflineReviews()}condition=navigator.onLine?"online":"offline",window.addEventListener("online",e),window.addEventListener("offline",e),lazyLoad()});const switch_map=()=>{"none"===document.getElementById("map").style.display?(document.getElementById("map-image").src="/icon/map-hide.svg",document.getElementById("map-image").setAttribute("aria-pressed","true"),document.getElementById("map").style.display="block"):(document.getElementById("map-image").src="/icon/map-show.svg",document.getElementById("map-image").setAttribute("aria-pressed","false"),document.getElementById("map").style.display="none")};window.indexedDB||window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");var dbPromise=idb.open("RestaurantDB",3,function(e){if(!e.objectStoreNames.contains("restaurantStore"))e.createObjectStore("restaurantStore",{keyPath:"id"});e.objectStoreNames.contains("reviewStore")||e.createObjectStore("reviewStore",{keyPath:"id"}).createIndex("restIndex","restaurant_id",{unique:!1});if(!e.objectStoreNames.contains("offlineReviewStore"))e.createObjectStore("offlineReviewStore",{autoIncrement:!0})});fillDB=(e=>{dbPromise.then(function(t){var n=t.transaction("restaurantStore","readwrite").objectStore("restaurantStore");e.forEach(function(e){n.put(e)})})}),readDB=(()=>dbPromise.then(function(e){return e.transaction("restaurantStore").objectStore("restaurantStore","readwrite").getAll()})),readDBRestaurantById=(e=>dbPromise.then(function(t){return t.transaction("restaurantStore").objectStore("restaurantStore","readwrite").get(parseInt(e))})),writeDBItem=(e=>{dbPromise.then(t=>t.transaction("restaurantStore","readwrite").objectStore("restaurantStore").put(e)).then(e=>console.log(e))}),fillReviewDB=(e=>{dbPromise.then(function(t){var n=t.transaction("reviewStore","readwrite").objectStore("reviewStore");e.forEach(function(e){n.put(e)})})}),readReviewsByID=(e=>dbPromise.then(function(t){return t.transaction("reviewStore","readonly").objectStore("reviewStore").index("restIndex").getAll(e)})),addOfflineReview=(e=>{dbPromise.then(function(t){t.transaction("offlineReviewStore","readwrite").objectStore("offlineReviewStore").put(e)})}),clearOfflineReview=(()=>{dbPromise.then(function(e){e.transaction("offlineReviewStore","readwrite").objectStore("offlineReviewStore").clear().onsuccess=function(){console.log("OfflineReviewStore cleared....")}})});class DBHelper{static get DATABASE_URL(){return"http://localhost:1337/restaurants "}static fetchRestaurants(e){readDB().then(function(t){""!=t&&(lastDBFetchResult=t,e(null,t)),fetch(DBHelper.DATABASE_URL).then(e=>e.json()).then(t=>{let n=t;JSON.stringify(lastDBFetchResult)!=JSON.stringify(n)?(fillDB(n),e(null,n)):console.log("No update needed")}).catch(function(e){console.log("Error in fetchRestaurants: "+e)})}).catch(function(e){console.log("Sorry, we have no data... code:  "+e)})}static fetchReviewById(e){return fetch("http://localhost:1337/reviews/?restaurant_id="+e).then(e=>e.json()).then(e=>{let t=e;return fillReviewDB(t),t})}static fetchRestaurantById(e,t){fetch(`http://localhost:1337/restaurants/${e}`).then(e=>e.json()).then(e=>{t(null,e)}).catch(function(e){console.log("Error: "+e)})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){DBHelper.fetchRestaurants((r,o)=>{if(r)n(r,null);else{let r=o;"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),n(null,r)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){return`/images/${e.photograph}.jpg`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}}