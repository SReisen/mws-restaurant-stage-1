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

// read database for mainpage
readDB = () =>{
    return dbPromise.then(function(db){
        var tx = db.transaction('restaurantStore');
        var store = tx.objectStore('restaurantStore', 'readwrite');
        return store.getAll();  
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
