# Goal:

* Match photos (with no gps information) to according point in a gpx-route and store the results in a geoJson-File.
* Display the geoJson-File on a map
* TODO: combine everything in a jekyll plugin or page-template that can be used to easily add a "hike post" to my blog

# Overview:

## geoJsonGenerator
* gpxpy - lib to load and parse gpx files
* gpxpy_repo - repo of gpxpy lib
* generateGeoJsonFromGPX.py
** matches images with gps-Track by using timestamps
** stores images & gps-Track as geoJson

## images
* images wanted to be matched

## routes
* gpx tracks

## web
* example webpage displaying the geoJson files

# Getting Started

## web
* TODO explain grunt

# TODO
* make script more customizable by removing hardcoded directories, etc.
* web ui: allow more user interaction, skipping through images, enlarge pics, aggregate pics according to zoomlevel, etc.
* integrate into blog
* clean up everything