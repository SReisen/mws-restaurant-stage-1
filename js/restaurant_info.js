let restaurant;
let reviews;
let revTrans;
var map;
let markFav;



/** 
 * The following function was written by david walsh and found on https://davidwalsh.name/lazyload-image-fade
 * */
window.addEventListener('load', function() {
  [].forEach.call(document.querySelectorAll('img[data-src]'), function(img) {
    img.setAttribute('src', img.getAttribute('data-src'));
    img.onload = function() {
      img.removeAttribute('data-src');
    };
  })
  });
  
  /**
   * Turn Googlemaps on / off on mobile view, This is nessessary to reach performance goals.
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      //console.error('this error:' + error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      
    }
  });
}
//Toggle mark favorite button
updateFavButton = () =>{
  if (self.restaurant.is_favorite){
    markFav.innerHTML = 'unmark Favorit'; 
  }
  else {
    markFav.innerHTML = 'mark Favorit';
  }
}

setFavorit = (rid) =>{ 
  let fav;
  // if value is not set by API
  if (self.restaurant.is_favorite == 'undefined') self.restaurant.is_favorite = false;
  let val = !self.restaurant.is_favorite;   
  // Read and change DB entries
  dbPromise.then(db => {
      let store = db.transaction('restaurantStore', 'readwrite').objectStore('restaurantStore');         
              fav = {
                   id: rid,
                  is_favorite : val
              };      
          console.log(val);
          store.put(fav);  
        self.restaurant.is_favorite = val;     
        updateFavButton();  
  }).then(function(){
      //Change value via API
      favUrl = 'http://localhost:1337/restaurants/' + rid +'/?is_favorite=' + val;
      r = fetch(favUrl, {method : 'POST'});
  /*}).then(r => {
      console.log(r + " " + val);*/
  })
  .catch(function (error) {
      console.log('Request failed', error);
  });
}

// Load reviews from DB or fetch it
fetchReview = (id) =>{
  return readReviewsByID(id).then(function(reviews){
    // If no reviews found in DB => fetch reviews
    if (reviews == 'undefined' || reviews == ''){
      console.log('Review Error: ' + reviews);
      // return DBHelper.fetchReviewById(id).then(function(reviews){
      return DBHelper.fetchReviews(id).then(function(reviews){
        return reviews;  
      })
    }
    else return reviews;
  })
}



/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      //hook
      fetchReview(self.restaurant.id).then(function(rev){
        revTrans = rev;
        console.log('reviews sind hier: ' + rev);
      fillRestaurantHTML();
      callback(null, restaurant);})
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

// Show red hart if favorite. 
// Todo: creat as button, contact server.
const favImg = document.createElement('img');
favImg.className = 'fav-img';
  if (restaurant.is_favorite == true){
    favImg.alt = restaurant.name + " is a favorite";
    favImg.src = '/icon/heart.svg';  
    } 
  else{
    favImg.alt = restaurant.name + " is not marked as a favorite";
    favImg.src = '/icon/heart-grey.svg';  
  } 
  document.getElementById('restaurant-address').append(favImg);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;


    
  const image = document.getElementById('restaurant-img');

  image.className = 'restaurant-img';
  image.alt = 'restaurant ' + restaurant.name;
  // choose image resolution depending on window with
  const winWith = window.innerWidth;
  if (DBHelper.imageUrlForRestaurant(restaurant) == '/icon/undefined.jpg'){
    image.src = '/icon/no-pic.svg';
    image.alt = "Sorry, there is no image for " + restaurant.name;
  }
  else if (winWith > 800) { image.src = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg','-800px.jpg'); }
  else if (winWith > 600) { image.src = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg','-600px.jpg'); }
  else { image.src = DBHelper.imageUrlForRestaurant(restaurant).replace('.jpg','-300px.jpg'); }
  
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type + ' Cousine';

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  //hours.tabIndex = 0;
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.tabIndex = 0;

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = revTrans) => {
  //reviews = DBHelper.fetchReviewById(self.restaurant.id)
//fillReviewsHTML = (reviews = (DBHelper.fetchReviewById(self.restaurant.id).then(function(reviews){return JSON.stringify(reviews) }))) => {
  console.log(reviews);
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  // Add button to write own review
  const writeRev = document.createElement('BUTTON');
  writeRev.innerHTML = '+ Write your own review';
  container.appendChild(writeRev);

  // Add button to mark the restaurant a favorite
  markFav = document.createElement('BUTTON');
  updateFavButton();
  /*if (self.restaurant.is_favorite){
    markFav.innerHTML = 'unmark Favorit'; 
  }
  else {
    markFav.innerHTML = 'mark Favorit';
  }*/
        //fetch(favUrl, {'method' : 'post}'});
        markFav.setAttribute("onclick","setFavorit(" + self.restaurant.id + ")");
  //markFav.onclick = "setFavorite(" + self.restaurant.id + self.restaurant.is_favorite + ")"
  console.log(self.restaurant.is_favorite);
  // setFavorit(self.restaurant.id, self.restaurant.is_favorite);
  
  container.appendChild(markFav);




  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex = 0;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
