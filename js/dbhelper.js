/**
 * Common database helper functions.
 */
//import idb from 'idb';

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
   

   */
  static initDB(restaurants){
    var dbPromise = idb.open('RestaurantDB', 1, function(upgradeDB){
        var store = upgradeDb.createObjectStore('restaurantStore');


    })

    return dbPromise.then(function(db){
      var tx = db.transaction('restaurantStore');
      var store = tx.objectStore('restaurantStore');
      return store.getAll();
 
   }).then(function(retData){
     console.log(retData);
     return retData;
   })

  }



  static initRestaurantDB(restaurants){
    
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    
    if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }

    // open Database
    var request = indexedDB.open('RestaurantDB', 1);

    // if database version has changed upgrade DB
    request.onupgradeneeded = function(event) {
      var db = event.target.result;

      var createRestaurantStore = db.createObjectStore("restaurantStore", { keyPath: "id" });

      createRestaurantStore.transaction.oncomplete = function(event) {
        // Store values in the newly created objectStore.
        var restaurantObjectStore = db.transaction("restaurantStore", "readwrite").objectStore("restaurantStore");
        restaurants.forEach(function(restaurant) { //restaurants kommt vom server
          console.log('foreach');
          restaurantObjectStore.add(restaurant);
        });
    }}

    request.onsuccess = function(event){
      // console.log("success!");
      var db = request.result;
       var restaurantObjectStore = db.transaction("restaurantStore", "readwrite").objectStore("restaurantStore");
        restaurants.forEach(function(restaurant) { //restaurants kommt vom server
          //console.log('foreach');
          restaurantObjectStore.add(restaurant);
        });
      
    }
    // Show error message if nesessary
    request.onerror = function(event) {
      alert("Database error: " + event.target.errorCode);
    };



  }
/* test readdb*/
static readDB(){ 
  dbPromise.then(function(db){
    var tx = db.transaction('restaurantStore');
    var store = tx.objectStore('restaurantStore');
    return store.getAll();
 }).then(function(data){
   console.log(data);
 })

    /*var request = indexedDB.open('RestaurantDB', 1);
   
    request.onsuccess = (function(event) {
      var db = event.target.result;
      console.log('readDb database open!');
      var restaurantObjectStore = db.transaction("restaurantStore", "readonly").objectStore("restaurantStore").oncomplete(function(messages){
      var restReturn = restaurantObjectStore.getAll(); 
        console.log('restreturn-json: ', JSON.stringify(messages));
      return restReturn.result;})
    }) ;  */


  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    console.log('start');
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then (restaurantJSON =>{
        let restaurants = restaurantJSON;
        //DBHelper.initRestaurantDB(restaurants);  
        DBHelper.initDB(restaurants);
        callback(null,restaurants);
      })
    //let xhr = new XMLHttpRequest();
    //test
    //xhr.open('GET', DBHelper.DATABASE_URL);
    //xhr.onload = () => {
    //  if (xhr.status === 200) { // Got a success response from server!
    //    const json = JSON.parse(xhr.responseText);
    //    const restaurants = json.restaurants;
     //   callback(null, restaurants);
    //  } else { // Oops!. Got an error from server.
     //   const error = (`Request failed. Returned status of ${xhr.status}`);
     //   callback(error, null);
     // }
    //};
    //xhr.send();
    .catch(e => requestError(e));
        
    function requestError(e) {
      console.log('damit!');
      //return DBHelper.initDB();
      //var restaurantList = DBHelper.initDB();
        DBHelper.initDB().then(function(rdata){
        console.log(rdata);
        callback(null, rdata);
        })
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
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
