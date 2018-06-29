let condition;
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
      if (condition == "online"){
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