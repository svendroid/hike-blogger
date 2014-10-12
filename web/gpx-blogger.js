(function(){
L.mapbox.accessToken = 'pk.eyJ1Ijoic3ZlbmRyb2lkIiwiYSI6Ii1kZ1g4cUEifQ.rBi__YNLLxPZwO0npRZQSQ'; //TODO use own access token
var map = L.mapbox.map('map', 'svendroid.j8miiopo', {
													    closePopupOnClick: true,
													    fullscreenControl: true,
                                                        keyboard: false
													}),
	timer;

var scriptPram = document.getElementById('gpx-blogger-script');
var geoJson = scriptPram.getAttribute('data-geojson');
var imagedir = scriptPram.getAttribute('data-imagedir');

if(geoJson == null){
    geoJson = 'imgFeatures.json';
    console.log('using default geoJson: ' + geoJson);
}
if(imagedir == null){
    imagedir = '../../images/';
    console.log('using default imagedir: ' + imagedir);
}

var currentImg;

var myLayer = L.mapbox.featureLayer().addTo(map);    	
jQuery.get(geoJson, function(geoJson){
	// Add features to the map
	myLayer.setGeoJSON(geoJson);

	var route = _.findWhere(geoJson, {id: "route"})
	if(route !== undefined){
		bounds = getBounds(route.geometry.coordinates);
		map.fitBounds(bounds); 
	}

});

//on adding a layer set its properties
myLayer.on('layeradd', function(e) {
    var marker = e.layer,
        feature = marker.feature;

    var layers = myLayer.getLayers();
   
    if(feature.geometry.type === 'Point'){ //style points
        marker.setIcon(L.mapbox.marker.icon({
                        'marker-color': '#f95020'
                        }));

        marker.on('click', function(e){
            var layers = myLayer.getLayers();
            _.find(layers, function(marker, index){ //find currentImgIndex
                if(marker.feature.properties.title === e.target.feature.properties.title){
                    currentImg = index;
                    return true;
                }
            })
        })

        var first = false;
        if(layers.length === 1){
            first = true;
        }
        
        addPopup(marker, first, false);        

    }

    if(feature.geometry.type === 'LineString'){ //style line
        marker.options.color = '#f95020';

        addPopup(layers[layers.length-2], false, true); //add 'last'-popup to previous marker because LineString is the last item in geojson and does not has a popup
    }
});

function addPopup(marker, first, last){
    // Create custom popup content
    var popupContent = '<img src="' + imagedir + marker.feature.properties.title+'" width="300px" >'+
                        '<div class="nav">' +
                            (first ? '' : '<a href="#" class="prev">&laquo; Vorheriges</a>') +
                            (last ? '' : '<a href="#" class="next">Nächstes &raquo;</a>') +
                            '</div>';

    // http://leafletjs.com/reference.html#popup
    marker.bindPopup(popupContent,{
        closeButton: false,
        minWidth: 320,
        autoPan: false //centering popup in onpopupopen by myself
    });


}

//get bounding box of a route, so the whole route is in sight
function getBounds(coords){
    var xmin = coords[0][0], xmax = coords[0][0], ymin = coords[0][1], ymax = coords[0][1];

    _.each(coords, function(coord){
        if(coord[0] < xmin){
            xmin = coord[0];
        } else if (coord[0] > xmax){
            xmax = coord[0];
        }

        if(coord[1] < ymin){
            ymin = coord[1];
        } else if (coord[1] > ymax){
            ymax = coord[1];
        }
    });

    var southWest = L.latLng(ymin, xmin),//switch lat/lon for geoJson coordinatessee http://gis.stackexchange.com/questions/54065/leaflet-geojson-coordinate-problem
        northEast = L.latLng(ymax, xmax),
        bounds = L.latLngBounds(southWest, northEast);
    return bounds;
}

function moveToImg(idx){
    var layers = myLayer.getLayers();
    
    if(idx < layers.length - 1 && idx >= 0){ //length -1 because layers last element is line which has no popup
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

map.on('autopanstart', function(e){
    console.log('in autopanstart');
});

map.on('popupopen', function(e) {
    popup = e.popup;
    
    //not calling panTo directly because height of popup is not calculated correctly until img is loaded - see http://stackoverflow.com/a/11164475/702478
    var images = popup._contentNode.getElementsByTagName('img');
    for (var i = 0, len = images.length; i < len; i++) {
        images[i].onload = onPopupImageLoad.bind(this, popup);
    }
});

function panToCenterOfPopup(popup){
    //pan to center of popup - http://stackoverflow.com/questions/22538473/leaflet-center-popup-and-marker-to-the-map
    var px = map.project(popup._latlng);
    px.y -= popup._container.clientHeight/2;
    map.panTo(map.unproject(px),{animate: true});
}

function onPopupImageLoad(popup) {
    console.log('img loaded - height: ' + popup._contentNode.clientHeight);
    panToCenterOfPopup(popup);
}

$(document).keydown(function(event){    
    var key = event.which;                
        switch(key) {
          case 37:
              // Key left
              moveToPrevImg();
              break;
          case 39:
              // Key right
              moveToNextImg();
              break;
    }   
});


})();