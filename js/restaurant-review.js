let condition;
var newFavoritSelection;// will set to true

/** 
 * The following function was written by david walsh and found on https://davidwalsh.name/lazyload-image-fade
 * */
lazyLoad = () => {
  console.log('lazyload called ');
  [].forEach.call(document.querySelectorAll('img[data-src]'), function(img) {
    img.setAttribute('src', img.getAttribute('data-src'));
    img.onload = function() {
      img.removeAttribute('data-src');
    };
  })
}

/**
* Add eventlistener to check online status. Snippet from https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events
**/
window.addEventListener('load', function() {
    var status = document.getElementById("status");
    var log = document.getElementById("log");
    condition = navigator.onLine ? "online" : "offline";

    function updateOnlineStatus(event) {
      condition = navigator.onLine ? "online" : "offline";
      if (condition == "online"){
        sendAllOfflineReviews();
      }
    }  

    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    lazyLoad();
});

/**
 * Turn Googlemaps on / off on mobile view.
 */
const switch_map = () => {    
    if (document.getElementById('map').style.display === 'none') {
      document.getElementById('map-image').src = '/icon/map-hide.svg';
      document.getElementById('map-image').setAttribute('aria-pressed','true');     
      document.getElementById('map').style.display = 'block'
    }
    else{   
      document.getElementById('map-image').src = '/icon/map-show.svg';
      document.getElementById('map-image').setAttribute('aria-pressed','false');   
      document.getElementById('map').style.display = 'none'   
    }
}

/**
 * The code in this file based on Jake Archibalds work. Especially on the idb library and wittr project
 */

/*
* check for IndexedDB support
*/
if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
  }

// open Database and upgrade if nessessarry
var dbPromise = idb.open('RestaurantDB', 3, function(upgradeDb){
    if (!upgradeDb.objectStoreNames.contains('restaurantStore')) {
        var store = upgradeDb.createObjectStore('restaurantStore', {keyPath: 'id'});
    }


    if (!upgradeDb.objectStoreNames.contains('reviewStore')) {
        var revStore = upgradeDb.createObjectStore('reviewStore', {keyPath: 'id'});
        revStore.createIndex('restIndex', 'restaurant_id', {unique: false});
    }

    // this store contain all reviews that got an error while sending and will be stored until network connection is reinstalled
    // the store uses a autoincriment index because the "final" review id will be assigned by the api-server
    if (!upgradeDb.objectStoreNames.contains('offlineReviewStore')) {
        var revStore = upgradeDb.createObjectStore('offlineReviewStore', {autoIncrement: true});
    }
})

/**
 * Fill and Update DB
 */
fillDB = (restaurants) => {
    dbPromise.then(function(db){
        var tx = db.transaction('restaurantStore', 'readwrite');
        var store = tx.objectStore('restaurantStore');
        restaurants.forEach(function(restaurant){
            store.put(restaurant);
        })
    })
}

/**
 * Read database for mainpage
 */
readDB = () =>{
    return dbPromise.then(function(db){
        var tx = db.transaction('restaurantStore');
        var store = tx.objectStore('restaurantStore', 'readwrite');
        return store.getAll();  
    })
}

/**
 * Read restaurant info from DB
 */ 
readDBRestaurantById = (id) => {
    return dbPromise.then(function(db){
        var tx = db.transaction('restaurantStore');
        var store = tx.objectStore('restaurantStore', 'readwrite');       
        let retdata = store.get(parseInt(id));
        return retdata;
    })
}

/**
 * Add item to DB
 */
writeDBItem = (data) =>{
    dbPromise.then(db => {
        return db.transaction('restaurantStore', 'readwrite')
          .objectStore('restaurantStore').put(data);
      }).then(obj => console.log(obj));
}

/**
 * Fill review store
 */
fillReviewDB = (reviews) =>{
    dbPromise.then(function(db){
        var tx = db.transaction('reviewStore', 'readwrite');
        var store = tx.objectStore('reviewStore');
        reviews.forEach(function(review){
            store.put(review);
        })
    })
}

/**
 * Read all reviews by restaurant ID .
 */
readReviewsByID = (restID) => {
    return dbPromise.then(function(db){
        var tx = db.transaction('reviewStore', 'readonly');
        var revStore = tx.objectStore('reviewStore');
        var retRevStore = revStore.index('restIndex').getAll(restID);
        return retRevStore;
    })
}

/**
 * add a review to offlineReview store after send failure
 */
addOfflineReview = (JSONdata) =>{
    dbPromise.then(function(db){
        var tx = db.transaction('offlineReviewStore', 'readwrite');
        var store = tx.objectStore('offlineReviewStore');
            store.put(JSONdata);
    }) 
}

/**
 * Clear offline reviewstore after sending all messages
 */
clearOfflineReview = () =>{
    dbPromise.then(function(db){
        var tx = db.transaction('offlineReviewStore', 'readwrite');
        var store = tx.objectStore('offlineReviewStore');      
        let confirmDelete = store.clear();
        confirmDelete.onsuccess = function() {         
           console.log('OfflineReviewStore cleared....');
          };
    })
}


/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants `;
  }

  /**
   * Fetch all restaurants. 
   */
  static fetchRestaurants(callback) {
    // first read data from DB
    readDB().then(function(rdata){

      if (rdata != ''){ 
        lastDBFetchResult = rdata;
        callback(null, rdata);
      }
 
      fetch(DBHelper.DATABASE_URL)
        .then(response => response.json())
        .then (restaurantJSON =>{
          let restaurants = restaurantJSON;
          //If actual fetch result is not equal with last fetch result => update DB 
            if (JSON.stringify(lastDBFetchResult) != JSON.stringify(restaurants)){
            fillDB(restaurants);
            callback(null,restaurants);
            }
            else console.log('No update needed');
        }).catch(function(error){
          console.log('Error in fetchRestaurants: ' + error);
        })   
    })
    .catch(function(e) {   //if there is a problem with the network....
        console.log('Sorry, we have no data... code:  ' + e);
    })
  }
  
  /**
   * Fetch reviews and update DB
   */
  static fetchReviewById(id){
    var fetUrl = 'http://localhost:1337/reviews/?restaurant_id=' + id;
    return fetch(fetUrl)
      .then(response => response.json())
      .then(reviewJSON =>{
        let reviews = reviewJSON;
        // Add reviews to db
        fillReviewDB(reviews);
        return reviews;
      })
  }

  /**
  * Fetch a restaurant by its ID.
  */
  static fetchRestaurantById(id, callback) {
    // new function
    fetch(`http://localhost:1337/restaurants/${id}`)
      .then(response => response.json())
      .then(restaurantJSON =>{
        let restaurantData = restaurantJSON;
        callback(null, restaurantData);
      }).catch(function(err){
        console.log('Error: ' + err);
        
      })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
  
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) { 
    // Fetch all restaurants
    
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants    
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.geändert
   */
  static imageUrlForRestaurant(restaurant) {
    // changed to .jpg
    return (`/images/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
