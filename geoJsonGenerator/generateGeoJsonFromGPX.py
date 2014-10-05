#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
sys.path.insert(0, './gpxpy') # use gpx lib from repo folder

import exifread
import datetime

import gpxpy
import gpxpy.gpx
from itertools import tee, islice, chain, izip
import os
import re
from geojson import Feature, Point, FeatureCollection, LineString

currentName = ""

def previous_and_next(some_iterable): # helper method to get a prev and next item in loop
    prevs, items, nexts = tee(some_iterable, 3)
    prevs = chain([None], prevs)
    nexts = chain(islice(nexts, 1, None), [None])
    return izip(prevs, items, nexts)

def printAllTags(tags): # print all img tags except the ones known for long, gibberish content
    print 'EXIF information:'
    for tag in tags.keys():
        if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
            print "Key: %s, value %s" % (tag, tags[tag])

def loadNextImgExif(i): # get next img metadata, returns None if all images have been checked
    try:
        name = i.next()
    except StopIteration:
        return None
    if isJpeg.match(name):
        print name
        global currentName
        currentName = name
        f = open(IMAGEDIR+'/'+name, 'rb') # Open image file for reading (binary mode)
        tags = exifread.process_file(f) # get Exif tags
        f.close()
        return tags
    else:
        return loadNextImgExif(i)

def getDateTimeOriginal(tags): # returns time picture was recorded
    orignalDateStr = tags['EXIF DateTimeOriginal'].values
    originalDate = datetime.datetime.strptime(orignalDateStr, DATETIMEFORMAT)
    return originalDate + datetime.timedelta(hours=-2) #UTC+2 used in images, all other calculations are done in UTC therfore substract 2 hours
            


DATETIMEFORMAT = '%Y:%m:%d %H:%M:%S'
IMAGEDIR = os.path.abspath(__file__ + "/../../images");
ROUTEDIR = os.path.abspath(__file__ + "/../../routes");
OUTPUTDIR = os.path.abspath(__file__ + "/../../web/imgFeatures.json");

isJpeg = re.compile(".*\.(jpeg|jpg)", re.IGNORECASE)

#############################################################

images = os.listdir(IMAGEDIR)
imgIterator = iter(images)

tags = loadNextImgExif(imgIterator)
orignalDate = getDateTimeOriginal(tags)

#printAllTags(tags)

gpx_file = open(ROUTEDIR + '/Move_2014_09_30_09_15_05_Bergsteigen.gpx', 'r')
gpx = gpxpy.parse(gpx_file)

featureImgs = []
lineCoordinates = []

for track in gpx.tracks:
    for segment in track.segments:
        for prev, point, nxt in previous_and_next(segment.points):
            lineCoordinates.append((point.longitude, point.latitude))

            found = True
            while found:

                if nxt != None and orignalDate >= point.time and orignalDate < nxt.time:
                    #addPointAndImg to json array
                    #print 'Point-Time: ' + point.time.strftime(DATETIMEFORMAT)
                    #print 'Image-Time: ' + orignalDate.strftime(DATETIMEFORMAT)
                    #print '***'
                    props = {}
                    props['title'] = currentName

                    featureImgs.append(Feature(geometry=Point((point.longitude, point.latitude)), properties=props))
                    #update next img
                    tags = loadNextImgExif(imgIterator)
                    if(tags != None):
                        orignalDate = getDateTimeOriginal(tags)
                        found = True
                    else:
                    	#print 'Letztes Bild ist zugeordnet!'
                        found = False #eigentlich ganz abrechen weil letztes bild wurde untersucht

                elif nxt == None:
               	    #print 'Letzer Trackpoint erreicht!'
                    found = False

                else:
                    found = False

featureImgs.append(Feature(geometry=LineString(lineCoordinates), id="route"))

geoJson = open(OUTPUTDIR, "w")
geoJson.write(str(featureImgs))
print str(featureImgs)
geoJson.close()

