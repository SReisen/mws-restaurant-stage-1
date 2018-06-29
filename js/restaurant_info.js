let restaurant;
let reviews;
let revTrans;
var map;
let markFav;
let container;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
    } 
    else {
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

// functions to handle review form
openForm = () => {
  document.getElementById('reviewModal').style.display = 'block';
}

closeForm = () => {
  document.getElementById('reviewModal').style.display = 'none'; 
  resetForm();
}

resetForm = () => {
  document.getElementById("userRating").reset();
}

processForm = () => {
  // read form data
  let fname = document.getElementById("formName").value;
  let frate;
  if (document.getElementById('radioButton1').checked) frate = 1;
  else if (document.getElementById('radioButton2').checked) frate = 2;
  else if (document.getElementById('radioButton3').checked) frate = 3;
  else if (document.getElementById('radioButton4').checked) frate = 4;
  else if (document.getElementById('radioButton5').checked) frate = 5;
  let ftext = document.getElementById("comments").value;
  //Build JSON body
  let formJSON = '{ ' + '"restaurant_id" : ' + self.restaurant.id + ', "name": ' + '"' + fname +'"' + ', "rating": ' + frate + ', "comments": ' + '"' + ftext +'"' + '}';
  closeForm();
  if (condition  == 'online') {
    sendReview(formJSON);}
  else {
    // add review to Reviewlist
    document.getElementById('reviews-list').appendChild(createReviewHTML(JSON.parse(formJSON)));
    addOfflineReview(formJSON);
  }
}


/**
 * Send all offline written reviews and update review list
 */
sendAllOfflineReviews = () =>{
  let oldReviewId;

  dbPromise.then(function(db){
    var tx = db.transaction('offlineReviewStore', 'readwrite');
    var store = tx.objectStore('offlineReviewStore');
    store.getAll().then(function(offlineReviews){
    offlineReviews.forEach(function(offlineReview){
      oldReviewId = offlineReview.restaurant_id;
      sendReview(offlineReview).then(function(){
        clearOfflineReview(offlineReview);              
      })
      })
      DBHelper.fetchReviewById(oldReviewId).then(function(reviews){
      updateReviewList(reviews); //update reviews list
      });
  })
  // delete offlineReviews
      }).then (function(){
          console.log('sendAllOffline...done..');
      })
} 

/**
 * get JSON and try to send, on error write it to upload store
 */
sendReview = (JSONBody) =>{
  return fetch('http://localhost:1337/reviews/', { 
    method: 'post',
    mode : 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSONBody 
  }).then(function(){
    console.log('POST successfull');
  })
  .catch(error => {
    console.log('Arg, a network Error:', error);
    // if review comes from form the write it to offlineReview store.
    addOfflineReview(JSONBody);
    })
  .then(res => {
    let jp = JSON.parse(JSONBody).restaurant_id;
    DBHelper.fetchReviewById(jp).then(function(reviews){
      updateReviewList(reviews);
    })
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
  // if value is not set by API set to false
  if (self.restaurant.is_favorite == 'undefined') self.restaurant.is_favorite = false;
  let val = !self.restaurant.is_favorite;   
  // Read and change DB entries
  dbPromise.then(db => {
      let store = db.transaction('restaurantStore', 'readwrite').objectStore('restaurantStore');         
          fav = store.get(rid);
          fav.is_favorite = val;    
          store.put(fav);  
        self.restaurant.is_favorite = val;     
        updateFavButton();  
  }).then(function(){
      //Change value via API
      favUrl = 'http://localhost:1337/restaurants/' + rid +'/?is_favorite=' + val;
      let r = fetch(favUrl, {method : 'POST'});
  })
  .catch(function (error) {
      console.log('Request failed', error);
  });
}

/**
 * fetch reviews from DB or from Network
 */
fetchReview = (id) =>{
  return readReviewsByID(id).then(function(reviews){
    // If no reviews found in DB => fetch reviews
    if (reviews == 'undefined' || reviews == ''){
      return DBHelper.fetchReviewById(id).then(function(reviews){
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
      fetchReview(self.restaurant.id).then(function(rev){
        revTrans = rev;
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
  container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  // Add button to write own review
  const writeRev = document.createElement('BUTTON');
  writeRev.innerHTML = '+ Write your own review';
  writeRev.setAttribute("onclick","openForm()"); 
  container.appendChild(writeRev);

  // Add button to mark the restaurant a favorite
  markFav = document.createElement('BUTTON');
  updateFavButton();
  markFav.setAttribute("onclick","setFavorit(" + self.restaurant.id + ")"); 

  container.appendChild(markFav);
  updateReviewList(reviews);
}

/**
 * Clear and recreate review list. This was separeted to update reviews
 */
updateReviewList = (reviews) => {
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
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
  const createdDate = new Date(self.restaurant.createdAt);
  date.innerHTML = createdDate.toDateString();
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
