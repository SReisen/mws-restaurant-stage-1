let restaurants,neighborhoods,cuisines;var map,markers=[];let lastDBFetchResult;document.addEventListener("DOMContentLoaded",e=>{fetchNeighborhoods(),fetchCuisines(),console.log("Restaurant updated: ")}),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.log(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const n=document.createElement("option");n.innerHTML=e,n.value=e,t.append(n)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const n=document.createElement("option");n.innerHTML=e,n.value=e,t.append(n)})}),window.initMap=(()=>{self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),updateRestaurants()}),updateRestaurantsAndFavorites=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),n=e.selectedIndex,s=t.selectedIndex,a=e[n].value,r=t[s].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,r,(e,t)=>{e?console.log(e):(resetRestaurants(t),fillRestaurantsHTML(),lazyLoad())})}),updateRestaurants=(()=>{const e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),n=e.selectedIndex,s=t.selectedIndex,a=e[n].value,r=t[s].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(a,r,(e,t)=>{e?console.log(e):(resetRestaurants(t),fillRestaurantsHTML())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(e=>e.setMap(null)),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e=self.restaurants)=>{const t=document.getElementById("restaurants-list");e.forEach(e=>{t.append(createRestaurantHTML(e))}),addMarkersToMap()}),createRestaurantHTML=(e=>{const t=document.createElement("li");let n;t.tabIndex=0;const s=document.createElement("img");s.className="restaurant-img",s.alt="restaurant "+e.name,"/images/undefined.jpg"==(n=DBHelper.imageUrlForRestaurant(e))?(s.setAttribute("data-src","/icon/no-pic.svg"),s.alt="Sorry, there is no image for "+e.name):s.setAttribute("data-src",n.replace(".jpg","-300px.jpg")),t.append(s);const a=document.createElement("img");a.className="fav-img","true"==e.is_favorite&&(a.alt=e.name+" is a favorite",a.setAttribute("data-src","/icon/heart.svg"),t.append(a));const r=document.createElement("h3");r.innerHTML=e.name,t.append(r);const o=document.createElement("p");o.innerHTML=e.neighborhood,t.append(o);const l=document.createElement("p");l.innerHTML=e.address,t.append(l);const c=document.createElement("a");return c.innerHTML="View Details",c.href=DBHelper.urlForRestaurant(e),t.append(c),t}),addMarkersToMap=((e=self.restaurants)=>{e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.map);google.maps.event.addListener(t,"click",()=>{window.location.href=t.url}),self.markers.push(t)})});