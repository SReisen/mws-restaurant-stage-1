/**
 * The code in this file based on Jake Archibalds work. Especially on the idb library and wittr project
 */

// check for IndexedDB support
if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
  }

// open Database and upgrade if nessessarry
var dbPromise = idb.open('RestaurantDB', 1, function(upgradeDb){
    if (!upgradeDb.objectStoreNames.contains('restaurantStore')) {
        var store = upgradeDb.createObjectStore('restaurantStore', {keyPath: 'id'});
    }

    if (!upgradeDb.objectStoreNames.contains('reviewStore')) {
        var revStore = upgradeDb.createObjectStore('reviewStore', {keyPath: 'id'});
        revStore.createIndex('restIndex', 'restaurant_id', {unique: false});
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

// Use the objectstore index to return reviews
readReviewsByID = (restID) => {
    return dbPromise.then(function(db){
        var tx = db.transaction('reviewStore', 'readonly');
        var revStore = tx.objectStore('reviewStore');

        var retRevStore = revStore.index('restIndex').getAll(restID);
        console.log(retRevStore); //contains all expected reviews
        return retRevStore;
    })
}

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


