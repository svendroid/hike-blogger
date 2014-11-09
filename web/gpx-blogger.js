var GPXMap = function(mapid, geoJson, imagedir){
    this.geoJson = geoJson;
    this.imagedir = imagedir;
    this.mapid = mapid;
    this.currentImg;
    this.myLayer;
}

GPXMap.prototype = {
    show: function(){
        /*L.mapbox.accessToken = 'pk.eyJ1Ijoic3ZlbmRyb2lkIiwiYSI6Ii1kZ1g4cUEifQ.rBi__YNLLxPZwO0npRZQSQ'; //TODO use own access token
        this.map = L.mapbox.map(this.mapid, 'svendroid.j8miiopo', {
                                                                closePopupOnClick: true,
                                                                keyboard: false,
                                                                fullscreenControl: true,
                                                                fullscreenControlOptions: {
                                                                    position: 'bottomright'
                                                                },
                                                                zoomControl: false
                                                            });*/

        this.map = L.map(this.mapid, {
            zoomControl: false
        }).setView([51.505, -0.09], 13);

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.map);

        new L.Control.Fullscreen({ position: 'bottomright'}).addTo(this.map);
        new L.Control.Zoom({ position: 'bottomright' }).addTo(this.map);

        if(this.geoJson == null){
            this.geoJson = 'imgFeatures.json';
            console.log('using default geoJson: ' + this.geoJson);
        }
        if(this.imagedir == null){
            this.imagedir = '../../images/';
            console.log('using default imagedir: ' + this.imagedir);
        }

        this.myLayer = L.geoJson().addTo(this.map);
        var that = this;    
        jQuery.get(this.geoJson, function(geoJson){
            // Add features to the map
            that.myLayer.addData(geoJson);

            var route = _.findWhere(geoJson, {id: "route"})
            if(route !== undefined){
                bounds = that.getBounds(route.geometry.coordinates);
                that.map.fitBounds(bounds); 
            }

        });

        //on adding a layer set its properties
        this.myLayer.on('layeradd', function(e) {
            var marker = e.layer,
                feature = marker.feature;

            var layers = that.myLayer.getLayers();
           
            if(feature.geometry.type === 'Point'){ //style points
                //marker.setIcon(L.Icon.Default);

                marker.on('click', function(e){                                        
                    var layers = that.myLayer.getLayers();
                    _.find(layers, function(marker, index){ //find currentImgIndex
                        if(marker.feature.properties.title === e.target.feature.properties.title){
                            that.currentImg = index;
                            return true;
                        }
                    })
                })

                var first = false;
                if(layers.length === 1){
                    first = true;
                }
                
                that.addPopup(marker, first, false);

            }

            if(feature.geometry.type === 'LineString'){ //style line
                marker.options.color = '#f95020';

                if(layers.length > 1){
                    that.addPopup(layers[layers.length-2], false, true); //add 'last'-popup to previous marker because LineString is the last item in geojson and does not has a popup
                }
            }
        });

        $('#'+this.mapid).on('click', '.nav a', function() {
                
            if ($(this).hasClass('prev')) {
                that.moveToPrevImg();
            } else {
                that.moveToNextImg();
            }
            return false;
        });

        this.map.on('autopanstart', function(e){
            console.log('in autopanstart');
        });

        this.map.on('popupopen', function(e) {
            popup = e.popup;

            if(this._zoom !== 15){
                this.setView(popup._latlng, 15, true);
            }
            //not calling panTo directly because height of popup is not calculated correctly until img is loaded - see http://stackoverflow.com/a/11164475/702478
            var images = popup._contentNode.getElementsByTagName('img');
            for (var i = 0, len = images.length; i < len; i++) {
                images[i].onload = that.panToCenterOfPopup.bind(that, popup);
            }
        });

        this.map.on("zoomstart", function (e) { console.log("ZOOMSTART", e); this.zooming = true; });
        this.map.on("zoomend", function (e) { console.log("ZOOMEND", e); this.zooming = false; });

        $(document).keydown(function(event){    
        var key = event.which;                
            switch(key) {
              case 37:
                  // Key left
                  that.moveToPrevImg();
                  break;
              case 39:
                  // Key right
                  that.moveToNextImg();
                  break;
            }   
        });
    },

    addPopup: function(marker, first, last){
        // Create custom popup content
        var popupContent = '<img src="' + this.imagedir + marker.feature.properties.title+'" width="340px" >'+
                            '<div class="nav">' +
                                (first ? '' : '<a href="#" class="prev">&laquo; Vorheriges</a>') +
                                (last ? '' : '<a href="#" class="next">Nächstes &raquo;</a>') +
                                '</div>';

        var popupContentNew = '<div style="background-image: url(' + this.imagedir + marker.feature.properties.title + ')" class="imagepopup"></div><div class="nav">' +
                                (first ? '' : '<a href="#" class="prev">&laquo; Vorheriges</a>') +
                                (last ? '' : '<a href="#" class="next">Nächstes &raquo;</a>') +
                                '</div>';

        // http://leafletjs.com/reference.html#popup
        marker.bindPopup(popupContent,{
            closeButton: false,
            minWidth: 360,
            autoPan: false //centering popup in panToCenterOfPopup by myself
        });


    },

    //get bounding box of a route, so the whole route is in sight
    getBounds: function (coords){
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
    },

    moveToImg: function(idx){
        var layers = this.myLayer.getLayers();
        
        if(idx < layers.length - 1 && idx >= 0){ //length -1 because layers last element is line which has no popup
            var marker = layers[idx];
            this.currentImg = idx;
            marker.openPopup();
        }
    },

    moveToNextImg: function(){
        this.moveToImg(this.currentImg + 1);
    },

    moveToPrevImg: function(){
        this.moveToImg(this.currentImg - 1);
    },

    panToCenterOfPopup: function(popup){
        //pan to center of popup - http://stackoverflow.com/questions/22538473/leaflet-center-popup-and-marker-to-the-map
        console.log(this.map._zoom);
        console.log(this.map.zooming);    
        if ( this.map.zooming ){
            this.map.addOneTimeEventListener('zoomend', this.panToCenterOfPopup.bind(this, popup));
        } else {
            var px = this.map.project(popup._latlng);
            px.y -= popup._container.clientHeight/2;
            px.y -= 20; //add pixel for top infobar 
            this.map.panTo(this.map.unproject(px), {animate: true});
        }

    }
}
