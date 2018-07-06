let condition;var newFavoritSelection;lazyLoad=()=>{console.log('lazyload called ');[].forEach.call(document.querySelectorAll('img[data-src]'),function(img){img.setAttribute('src',img.getAttribute('data-src'));img.onload=function(){img.removeAttribute('data-src')}})}
window.addEventListener('load',function(){var status=document.getElementById("status");var log=document.getElementById("log");condition=navigator.onLine?"online":"offline";function updateOnlineStatus(event){condition=navigator.onLine?"online":"offline";if(condition=="online"){sendAllOfflineReviews()}}
window.addEventListener('online',updateOnlineStatus);window.addEventListener('offline',updateOnlineStatus);lazyLoad()});const switch_map=()=>{if(document.getElementById('map').style.display==='none'){document.getElementById('map-image').src='/icon/map-hide.svg';document.getElementById('map-image').setAttribute('aria-pressed','true');document.getElementById('map').style.display='block'}
else{document.getElementById('map-image').src='/icon/map-show.svg';document.getElementById('map-image').setAttribute('aria-pressed','false');document.getElementById('map').style.display='none'}}
if(!window.indexedDB){window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")}
var dbPromise=idb.open('RestaurantDB',3,function(upgradeDb){if(!upgradeDb.objectStoreNames.contains('restaurantStore')){var store=upgradeDb.createObjectStore('restaurantStore',{keyPath:'id'})}
if(!upgradeDb.objectStoreNames.contains('reviewStore')){var revStore=upgradeDb.createObjectStore('reviewStore',{keyPath:'id'});revStore.createIndex('restIndex','restaurant_id',{unique:!1})}
if(!upgradeDb.objectStoreNames.contains('offlineReviewStore')){var revStore=upgradeDb.createObjectStore('offlineReviewStore',{autoIncrement:!0})}})
fillDB=(restaurants)=>{dbPromise.then(function(db){var tx=db.transaction('restaurantStore','readwrite');var store=tx.objectStore('restaurantStore');restaurants.forEach(function(restaurant){store.put(restaurant)})})}
readDB=()=>{return dbPromise.then(function(db){var tx=db.transaction('restaurantStore');var store=tx.objectStore('restaurantStore','readwrite');return store.getAll()})}
readDBRestaurantById=(id)=>{return dbPromise.then(function(db){var tx=db.transaction('restaurantStore');var store=tx.objectStore('restaurantStore','readwrite');let retdata=store.get(parseInt(id));return retdata})}
writeDBItem=(data)=>{dbPromise.then(db=>{return db.transaction('restaurantStore','readwrite').objectStore('restaurantStore').put(data)}).then(obj=>console.log(obj))}
fillReviewDB=(reviews)=>{dbPromise.then(function(db){var tx=db.transaction('reviewStore','readwrite');var store=tx.objectStore('reviewStore');reviews.forEach(function(review){store.put(review)})})}
readReviewsByID=(restID)=>{return dbPromise.then(function(db){var tx=db.transaction('reviewStore','readonly');var revStore=tx.objectStore('reviewStore');var retRevStore=revStore.index('restIndex').getAll(restID);return retRevStore})}
addOfflineReview=(JSONdata)=>{dbPromise.then(function(db){var tx=db.transaction('offlineReviewStore','readwrite');var store=tx.objectStore('offlineReviewStore');store.put(JSONdata)})}
clearOfflineReview=()=>{dbPromise.then(function(db){var tx=db.transaction('offlineReviewStore','readwrite');var store=tx.objectStore('offlineReviewStore');let confirmDelete=store.clear();confirmDelete.onsuccess=function(){console.log('OfflineReviewStore cleared....')}})}
class DBHelper{static get DATABASE_URL(){const port=1337;return `http://localhost:${port}/restaurants `}
static fetchRestaurants(callback){readDB().then(function(rdata){if(rdata!=''){lastDBFetchResult=rdata;callback(null,rdata)}
fetch(DBHelper.DATABASE_URL).then(response=>response.json()).then(restaurantJSON=>{let restaurants=restaurantJSON;if(JSON.stringify(lastDBFetchResult)!=JSON.stringify(restaurants)){fillDB(restaurants);callback(null,restaurants)}
else console.log('No update needed')}).catch(function(error){console.log('Error in fetchRestaurants: '+error)})}).catch(function(e){console.log('Sorry, we have no data... code:  '+e)})}
static fetchReviewById(id){var fetUrl='http://localhost:1337/reviews/?restaurant_id='+id;return fetch(fetUrl).then(response=>response.json()).then(reviewJSON=>{let reviews=reviewJSON;fillReviewDB(reviews);return reviews})}
static fetchRestaurantById(id,callback){fetch(`http://localhost:1337/restaurants/${id}`).then(response=>response.json()).then(restaurantJSON=>{let restaurantData=restaurantJSON;callback(null,restaurantData)}).catch(function(err){console.log('Error: '+err)})}
static fetchRestaurantByCuisine(cuisine,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null)}else{const results=restaurants.filter(r=>r.cuisine_type==cuisine);callback(null,results)}})}
static fetchRestaurantByNeighborhood(neighborhood,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null)}else{const results=restaurants.filter(r=>r.neighborhood==neighborhood);callback(null,results)}})}
static fetchRestaurantByCuisineAndNeighborhood(cuisine,neighborhood,callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null)}else{let results=restaurants
if(cuisine!='all'){results=results.filter(r=>r.cuisine_type==cuisine)}
if(neighborhood!='all'){results=results.filter(r=>r.neighborhood==neighborhood)}
callback(null,results)}})}
static fetchNeighborhoods(callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null)}else{const neighborhoods=restaurants.map((v,i)=>restaurants[i].neighborhood)
const uniqueNeighborhoods=neighborhoods.filter((v,i)=>neighborhoods.indexOf(v)==i)
callback(null,uniqueNeighborhoods)}})}
static fetchCuisines(callback){DBHelper.fetchRestaurants((error,restaurants)=>{if(error){callback(error,null)}else{const cuisines=restaurants.map((v,i)=>restaurants[i].cuisine_type)
const uniqueCuisines=cuisines.filter((v,i)=>cuisines.indexOf(v)==i)
callback(null,uniqueCuisines)}})}
static urlForRestaurant(restaurant){return(`./restaurant.html?id=${restaurant.id}`)}
static imageUrlForRestaurant(restaurant){return(`/images/${restaurant.photograph}.jpg`)}
static mapMarkerForRestaurant(restaurant,map){const marker=new google.maps.Marker({position:restaurant.latlng,title:restaurant.name,url:DBHelper.urlForRestaurant(restaurant),map:map,animation:google.maps.Animation.DROP});return marker}}