let restaurant;
let reviews;
let revTrans;
var map;
let markFav;
let condition;
let container;




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
  * Add eventlistener to check online status. Snippet from https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/Online_and_offline_events
  **/
  window.addEventListener('load', function() {
    var status = document.getElementById("status");
    var log = document.getElementById("log");
    condition = navigator.onLine ? "online" : "offline";
  
    function updateOnlineStatus(event) {
      condition = navigator.onLine ? "online" : "offline";
      console.log('Condition: ' + condition);
      if (condition == "online"){
        console.log('Yeah, back online.....');
        sendAllOfflineReviews();

      }
    }  
    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
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

openForm = () => {
  console.log('openForm called');
  document.getElementById('reviewModal').style.display = 'block';
}

closeForm = () => {
  console.log('closeForm called');
  document.getElementById('reviewModal').style.display = 'none'; 
  resetForm();
}

resetForm = () => {
  document.getElementById("userRating").reset();
}

setStars = (stars) =>{
  // TODO fill rating with stars
}
// if system is back online send reviews
sendAllOfflineReviews = () =>{
  console.log('sendAllOfflineReviews called...');
  let oldReviewId;
  dbPromise.then(function(db){
      var tx = db.transaction('offlineReviewStore', 'readwrite');
      var store = tx.objectStore('offlineReviewStore');
      store.getAll().then(function(offlineReviews){
      console.log('OfflineReviews: ' + offlineReviews);
      offlineReviews.forEach(function(offlineReview){
          console.log(offlineReview);
          oldReviewId = offlineReview.restaurant_id;
          sendReview(offlineReview).then(function(){
              clearOfflineReview(offlineReview);              
          })
          }).then(function(){
              // wait till all reviews are send
               DBHelper.fetchReviewById(oldReviewId).then(function(reviews){
                fillReviewsHTML(reviews); //update reviews container
               });
          })
     // })
  })
  // delete offlineReviews
      }).then (function(){
          console.log('OldReviewsSend, huray');
          console.log('refetch started.....')

         // fetchReviews();
      })
} 



/**
 * get JSON and try to send, on error write it to upload store
 */
sendReview = (JSONBody) =>{
  return fetch('http://localhost:1337/reviews/', { //return nesessary???
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
    console.log('jason Body:' + JSONBody);
    let jp = JSON.parse(JSONBody).restaurant_id;
    console.log(jp);
    console.log('sendReview => fetchReviewbyId: ' + jp);
    DBHelper.fetchReviewById(jp).then(function(reviews){
      console.log('sendReview => fetched by ID now => fillReviewsHtml');
      //let reviewListUL = document.getElementById('reviews-list');
      //reviewListUL.innerHTML = '';
      updateReviewList(reviews);
    })
  });

}
processForm = () => {
  // Todo save and send form
  console.log('processForm wurde aufgerufen. Condition: ' + condition);
  let fname = document.getElementById("formName").value;
  let frate = 4;// test value 
  let ftext = document.getElementById("comments").value;
  //Build JSON body
  let formJSON = '{ ' + '"restaurant_id" : ' + self.restaurant.id + ', "name": ' + '"' + fname +'"' + ', "rating": ' + frate + ', "comments": ' + '"' + ftext +'"' + '}';//+ ', "id" : 1' + '}';
  closeForm();
  console.log('processform condition: ' + condition);
  if (condition  = 'online') sendReview(formJSON);
  else addOfflineReview(formJSON);
  console.log(formJSON);

/*
  fetch('http://localhost:1337/reviews/', {
    method: 'post',
    mode : 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: formJSON 
  }).then(res=>res.json())
  .catch(error => console.log('Error:', error))
  .then(res => console.log(res));*/
  //return false;
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
  console.log(reviews);
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

  console.log(self.restaurant.is_favorite);
  container.appendChild(markFav);
  updateReviewList(reviews);
  /*if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);*/
}

/**
 * Clear and recreate review list. This was separeted to update reviews
 */
updateReviewList = (reviews) => {
  //let reviewListUL = document.getElementById('reviews-list');
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  //const ul = document.getElementById('reviews-list');
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
 * Prepare form
 */
createReviewFormHtml = () => {
  // Add hidden id field to add restaurant ID into JSON
  /*const formId = document.createElement("INPUT");
  formId.type = "hidden";
  formId.id = "restaurant_id";
  formId.value = self.restaurant.id;
  document.getElementById("fieldName").appendChild(formId);*/

  //document.getElementById("submit").onclick = processForm();
  
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
