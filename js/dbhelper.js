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
      callback(null, rdata);
      })
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then (restaurantJSON =>{
        let restaurants = restaurantJSON;
        fillDB(restaurants);
        // Add reviews??? or in fill DB
        //callback(null,restaurants);
        fillRestaurantsHTML(restaurants);
      })
    .catch(function(e) {   //if there is a problem with the network....
        console.log('Sorry, we have no data... code:  ' + e);
        })

  }
  
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
// spilt in 2 parts fetch all and by id!!!!
 // fetch all reviews
  static fetchReviews(id){
    return fetch('http://localhost:1337/reviews/')
      .then(response => response.json())
      .then(reviewJSON =>{
        let reviews = reviewJSON;
        fillReviewDB(reviews);
        //callback(readReviewsByID(id));// produziert Fehler
        return readReviewsByID(id).then(function(reData){
          //return JSON.stringify(reData);
          return(null, reData);
        })
      })
    .catch(function(e) {   
          console.log(e);
          //callback(null, e);
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
      })
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
