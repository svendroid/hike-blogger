# About hike-blogger:

* Matches photos (with no gps information) to according points in a gpx-route and stores the results in a geoJson-File.
* Displays the geoJson-File on a map
* TODO: combine everything in a jekyll plugin or page-template that can be used to easily add a "hike post" to my blog

***

# Overview:

## /geoJsonGenerator
* gpxpy - lib to load and parse gpx files
* gpxpy_repo - repo of gpxpy lib
* generateGeoJsonFromGPX.py
** matches images with gps-Track by using timestamps
** stores images & gps-Track as geoJson

## /images
* test images that are matched with the gps-route

## /routes
* gpx tracks

## /web
* example webpage displaying the geoJson files

***

## Getting Started web ##
* install node, npm & grunt & afterwards execute `npm install`.
* see "Grunt Getting Started Guide" for more details - [http://gruntjs.com/getting-started](http://gruntjs.com/getting-started)

### Development Server ###
Use `grunt devServer` to host the page locally `http://localhost:9090`. It is reloaded automatically when a file changes.

***

# TODO
* make script more customizable by removing hardcoded directories, etc.
* web ui: allow more user interaction, skipping through images, enlarge pics, aggregate pics according to zoomlevel, etc.
* integrate into blog
* clean up everything