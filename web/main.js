(function(){
L.mapbox.accessToken = 'pk.eyJ1Ijoic3ZlbmRyb2lkIiwiYSI6Ii1kZ1g4cUEifQ.rBi__YNLLxPZwO0npRZQSQ'; //TODO use own access token
var map = L.mapbox.map('map', 'svendroid.j8miiopo', {
													    closePopupOnClick: true,
													    fullscreenControl: true
													}),
	timer;


var currentImg;

var myLayer = L.mapbox.featureLayer().addTo(map);    	
jQuery.get('imgFeatures.json', function(geoJson){
	// Add features to the map
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

    if(feature.geometry.type === 'Point'){ //style points
        marker.setIcon(L.mapbox.marker.icon({
                        'marker-color': '#f95020'
                        }));
    }

    if(feature.geometry.type === 'LineString'){ //style line
        marker.options.color = '#f95020';
    }

    marker.on('click', function(e){
        var layers = myLayer.getLayers();
        _.find(layers, function(marker, index){ //find currentImgIndex
            if(marker.feature.properties.title === e.target.feature.properties.title){
                currentImg = index;
                return true;
            }
        })
    })

    // Create custom popup content
    var popupContent = '<img src="../../images/'+feature.properties.title+'" width="300px">'+
                        '<div class="nav">' +
                            '<a href="#" class="prev">&laquo; Previous</a>' +
                            '<a href="#" class="next">Next &raquo;</a>' +
                        '</div>';

    // http://leafletjs.com/reference.html#popup
    marker.bindPopup(popupContent,{
        closeButton: false,
        minWidth: 320
    });
});

function moveToImg(idx){
    var layers = myLayer.getLayers();
    if(idx < layers.length && idx > 0){
        var marker = layers[idx];
            currentImg = idx;
            marker.openPopup();
    }
}

function moveToNextImg(){
    moveToImg(currentImg + 1);
}

function moveToPrevImg(){
    moveToImg(currentImg - 1);
}

$('#map').on('click', '.nav a', function() {
    
    if ($(this).hasClass('prev')) {
        moveToPrevImg();
    } else {
        moveToNextImg();
    }
    return false;
});

map.on('popupopen', function(e) {
    //pan to center of popup - http://stackoverflow.com/questions/22538473/leaflet-center-popup-and-marker-to-the-map
    var px = map.project(e.popup._latlng);
    console.log(px.y);
    px.y -= e.popup._container.clientHeight/2;
    console.log(px.y);
    map.panTo(map.unproject(px),{animate: true});
});


})();