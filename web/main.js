(function(){
L.mapbox.accessToken = 'pk.eyJ1Ijoic3ZlbmRyb2lkIiwiYSI6Ii1kZ1g4cUEifQ.rBi__YNLLxPZwO0npRZQSQ'; //TODO use own access token
var map = L.mapbox.map('map', 'svendroid.j8miiopo', {
													    closePopupOnClick: true,
													    fullscreenControl: true
													}),
	timer;




var myLayer = L.mapbox.featureLayer().addTo(map);    	
jQuery.get('imgFeatures.json', function(geoJson){
	// Add features to the map
	console.log(geoJson);
	myLayer.setGeoJSON(geoJson);

	var route = _.findWhere(geoJson, {id: "route"})
	if(route !== undefined){
		coords = route.geometry.coordinates;
		var southWest = L.GeoJSON.coordsToLatLng(coords[0], true),
    		northEast = L.GeoJSON.coordsToLatLng(coords[coords.length-1], true), //switch lat/lon for geoJson coordinatessee http://gis.stackexchange.com/questions/54065/leaflet-geojson-coordinate-problem
    		bounds = L.latLngBounds(southWest, northEast);
		map.fitBounds(bounds); 
	}

});


myLayer.on('layeradd', function(e) {
    var marker = e.layer;
    var feature = marker.feature;

    // Create custom popup content
    var popupContent = '<img src="../../images/'+feature.properties.title+'" width="300px">';

    // http://leafletjs.com/reference.html#popup
    marker.bindPopup(popupContent,{
        closeButton: false,
        minWidth: 320
    });
});


})();