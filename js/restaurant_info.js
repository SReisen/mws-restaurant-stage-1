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
      console.log('Wow an error....');
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

/**
 * Make form visible
 */
openForm = () => {
  document.getElementById('reviewModal').style.display = 'block';
}

/**
 * hide and move element
 */
closeForm = () => {
  document.getElementById('reviewModal').style.display = 'none'; 
  // move reviewModal out of the review list because an update of the reviewlist would delete the element
  document.getElementById('footer').appendChild(document.getElementById('reviewModal'));
  resetForm();
}

/**
 * Clear form
 */
resetForm = () => {
  document.getElementById("userRating").reset();
}

/**
 * Read formdata and create review
 */
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
      document.getElementById('reviews-list').insertBefore(createReviewHTML(JSON.parse(formJSON)), document.getElementById('reviews-list').childNodes[0]);
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
    console.log('Network Error:', error);
    // if review comes from form => write it to offlineReview store.
    addOfflineReview(JSONBody);
    })
  .then(res => {
    let jp = JSON.parse(JSONBody).restaurant_id;
    DBHelper.fetchReviewById(jp).then(function(reviews){
      updateReviewList(reviews);
    })
  });
}

/**
 * Toggle mark favorite checkbox
 */
updateFavCheckbox = () =>{
  if (self.restaurant.is_favorite == "true"){
    markFav.checked = true;
    markFav.setAttribute("aria-checked", "true");
    //markFav.innerHTML = 'unmark Favorit'; 
  }
  else {
    markFav.checked = false;
    markFav.setAttribute("aria-checked", "false");
    //markFav.innerHTML = 'mark Favorit';
  }
}

/**
 * Set favorit status in DB and API
 */
setFavorit = (rid) =>{ 
  let restObject;
  let favData;
  // if value is not set by API set to false
  if ((self.restaurant.is_favorite == 'undefined') || (self.restaurant.is_favorite == false)) self.restaurant.is_favorite = "false";

  let val;
  if (self.restaurant.is_favorite == "true") val = "false" ;
  else val = "true";   
  // Read and change DB entries
  dbPromise.then(db => {
      let store = db.transaction('restaurantStore', 'readwrite').objectStore('restaurantStore');  

      store.get(rid).then(function(favData){
        favData.is_favorite = val;
        writeDBItem(favData);
      })
      self.restaurant.is_favorite = val;   
      updateFavCheckbox();  
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
  let update = "false";
  const id = getParameterByName('id');

  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  }
  readDBRestaurantById(id).then(function(restaurantFromDb){
    self.restaurant = restaurantFromDb;

    fetchReview(self.restaurant.id).then(function(rev){
      revTrans = rev;

      // check for updates if online
      if (condition == 'online'){
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
          update = "true"; 
          if ((!restaurant) || (restaurant == 'undefined')) {
            console.error(error);
            return;
          }
          if(JSON.stringify(self.restaurant) == JSON.stringify(restaurant)){
            update = false;
            console.log('Restaurant data has not changed!');
            return
          }
          else {
            self.restaurant = restaurant;
            updateRestaurantHTML();
          }   
        }) 
      } 
    
    if (update == "false") {
      fillRestaurantHTML();
      callback(null, restaurantFromDb);
    }

    }).catch(function(e){
      console.log(e);
      revTrans = '';
      fillRestaurantHTML();
      callback(null, restaurantFromDb);
    })   
  }) 
}

/**
 *  Update Restaurant.html if fetch differs from DB entries
 */
updateRestaurantHTML = (restaurant) => {
  // delete values that will append by fillRestaurantHoursHTML and fillReviewsHTML then call fillRestaurantHTML, 
  document.getElementById('restaurant-hours').innerHTML = '';
  document.getElementById('reviews-container').innerHTML = '';
  fillRestaurantHTML();

}
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

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
  writeRev.setAttribute("onclick","createReviewFormHTML()"); 
  container.appendChild(writeRev);

  // Add checkbox to mark the restaurant a favorite
  favLabel = document.createElement('LABEL');
  favLabel.setAttribute("id", "favCheckBoxLabel");
  favLabel.innerHTML = 'Mark this restaurant as a favorite here: ';
  favLabel.setAttribute( "for", "favoritCheckbox");
  container.appendChild(favLabel);
  markFav = document.createElement('INPUT');
  markFav.setAttribute("type", "checkbox");
  markFav.setAttribute("id", "favoritCheckbox");
  markFav.setAttribute("aria-checked", "true")

  updateFavCheckbox();
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
    if (condition == 'online') noReviews.innerHTML = 'No reviews yet!';
    else noReviews.innerHTML = 'Reviews can not be loaded because network connection is offline!';
    container.appendChild(noReviews);
    return;
  }
  reviews.forEach(review => {
    ul.insertBefore(createReviewHTML(review), ul.childNodes[0]);
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
 *  Create form for review
 */
createReviewFormHTML = () =>{
  const modal = document.getElementById('reviewModal');
  modal.style.display = 'block';
  const ul = document.getElementById('reviews-list');
  ul.insertBefore(modal, ul.childNodes[0]);
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
