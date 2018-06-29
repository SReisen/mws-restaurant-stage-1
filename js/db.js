/**
 * The code in this file based on Jake Archibalds work. Especially on the idb library and wittr project
 */

// check for IndexedDB support
if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
  }

// open Database and upgrade if nessessarry
var dbPromise = idb.open('RestaurantDB', 2, function(upgradeDb){
    if (!upgradeDb.objectStoreNames.contains('restaurantStore')) {
        var store = upgradeDb.createObjectStore('restaurantStore', {keyPath: 'id'});
    }


    if (!upgradeDb.objectStoreNames.contains('reviewStore')) {
        var revStore = upgradeDb.createObjectStore('reviewStore', {keyPath: 'id'});
        revStore.createIndex('restIndex', 'restaurant_id', {unique: false});
    }

    // this store contain all reviews that got an error while sending
    // the store uses a autoincriment index because the "final" review id will be assigned by the api-server
    if (!upgradeDb.objectStoreNames.contains('offlineReviewStore')) {
        var revStore = upgradeDb.createObjectStore('offlineReviewStore', {autoIncrement: true});
    }
})

// Fill and Update DB
fillDB = (restaurants) => {
    dbPromise.then(function(db){
        var tx = db.transaction('restaurantStore', 'readwrite');
        var store = tx.objectStore('restaurantStore');
        restaurants.forEach(function(restaurant){
            store.put(restaurant);
        })
    })
}

// Fill review store
fillReviewDB = (reviews) =>{
    dbPromise.then(function(db){
        var tx = db.transaction('reviewStore', 'readwrite');
        var store = tx.objectStore('reviewStore');
        reviews.forEach(function(review){
            store.put(review);
        })
    })
}

// Use the objectstore index to return reviews for selected restaurant
readReviewsByID = (restID) => {
    return dbPromise.then(function(db){
        var tx = db.transaction('reviewStore', 'readonly');
        var revStore = tx.objectStore('reviewStore');

        var retRevStore = revStore.index('restIndex').getAll(restID);
        console.log(retRevStore); //contains all expected reviews
        return retRevStore;
    })
}

// add a review to offlineReview store after send failure
// add offlineId to JSON  
addOfflineReview = (JSONdata) =>{
    dbPromise.then(function(db){
        var tx = db.transaction('offlineReviewStore', 'readwrite');
        var store = tx.objectStore('offlineReviewStore');
            store.put(JSONdata);
    }) 
}

// get all offline reviews after established internetconnection OBSOLET!!!
readOfflineReviews = () =>{
    return dbPromise.then(function(db){
        var tx = db.transaction('offlineReviewStore');
        var store = tx.objectStore('offlineReviewStore', 'readonly');
        return store.getAll(); 
     })
}

// delete offline review after sending
/*deleteOfflineReview = (offlineId) => {
    dbPromise.then(function(db){
        var tx = db.transaction('offlineReviewStore', 'readwrite');
        var store = tx.objectStore('offlineReviewStore');      
        store.delete(offlineId);
        return tx.complete;
        }).then(function() {
            console.log('Item deleted');
    });
}*/
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
/* Moved to restaurant.info
// if system is back online send reviews
sendAllOfflineReviews = () =>{
    console.log('sendAllOfflineReviews called...');
    let oldReviewId;
    //let offlineReviews = readOfflineReviews();
    dbPromise.then(function(db){
        var tx = db.transaction('offlineReviewStore', 'readwrite');
        var store = tx.objectStore('offlineReviewStore');
        //let offlineReviews = store.getAll().then(function(){}
        store.getAll().then(function(offlineReviews){
        console.log('OfflineReviews: ' + offlineReviews);
        offlineReviews.forEach(function(offlineReview){
            console.log(offlineReview);
            //           let JSONSend = store.get(offlineReview);
            //store.get(offlineReview).then(function(JSONSend){
           // console.log('JASON: ' + JSONSend);
            oldReviewId = offlineReview.restaurant_id;
            sendReview(offlineReview).then(function(){
                clearOfflineReview(offlineReview);              
            })
            }).then(function(){
                // wait till all reviews are send
                 DBHelper.fetchReviewById(oldReviewId).then(function(){

                 });
            })
          // send offline reviews
       // })
    })
    // delete offlineReviews
        }).then (function(){
            console.log('OldReviewsSend, huray');
            //DBHelper.fetchReviews(oldReviewId);
            console.log('refetch started.....')

           // fetchReviews();
        })
} */


// read singe item for detailpage
readDBItem = (id) =>{
    dbPromise.then(db => {
        return db.transaction('restaurantStore', 'readwrite')
          .objectStore('restaurantStore').get(id);
      }).then(obj => console.log(obj));
}

// read database for mainpage
readDB = () =>{
    return dbPromise.then(function(db){
        var tx = db.transaction('restaurantStore');
        var store = tx.objectStore('restaurantStore', 'readwrite');
        return store.getAll();
   
     })
}


