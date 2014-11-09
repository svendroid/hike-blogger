#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), './gpxpy')) # use gpx lib from folder next to py script

import getopt # used to read options from cmdline

import exifread
import datetime

import gpxpy
import gpxpy.gpx
from itertools import tee, islice, chain, izip
import os
import re
from geojson import Feature, Point, FeatureCollection, LineString

import json

currentName = ""

DATETIMEFORMAT = '%Y:%m:%d %H:%M:%S'

isJpeg = re.compile(".*\.(jpeg|jpg)", re.IGNORECASE)

def main(argv): # main method handling args input
    try:
        IMAGEDIR = os.path.abspath(__file__ + "/../../images")
        ROUTE = None
        ROUTE = os.path.abspath(__file__ + "/../../routes/Move_2014_09_30_09_15_05_Bergsteigen.gpx");
        OUTPUT = os.path.abspath(__file__ + "/../../web/imgFeatures.json")
        OUTPUTINFO = os.path.abspath(__file__ + "/../../web/info.json")
        opts, args = getopt.getopt(argv, "hi:o:s:", ["help", "imagedir=", "output=", "outputinfo="])
    except getopt.GetoptError:
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt in ("-h", "--help"):
            usage()
            sys.exit()
        elif opt in ("-i", "--imagedir="):
            IMAGEDIR = arg
        elif opt in ("-o", "--output"):
            OUTPUT = arg
        elif opt in ("-s", "--outputinfo"):
            OUTPUTINFO = arg

    if(len(args) >= 1): #args contains not used arg 
        #print 'REMAINING args: ', args
        ROUTE = args[0] #if file name is first all options are ignored

    if ROUTE == None:
        usage()
        sys.exit(2)

    generateGeoJson(IMAGEDIR, ROUTE, OUTPUT, OUTPUTINFO)

#####################

def usage(): #explains usage of script
    print """    usage: generateGeoJsonFromGPX.py [-options] file
    options:
        [-h | --help]         : displays this help message
        [-i | --imagedir=]    : directory containing images, default: images
        [-o | --output=]      : output file, default: route.json
        [-io | --outputinfo=] : output info file, default: info.json
        file                 input file e.g. route.gpx
    """
    
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

def loadNextImgExif(i, IMAGEDIR): # get next img metadata, returns None if all images have been checked
    try:
        name = i.next()
    except StopIteration:
        return None
    if isJpeg.match(name):
        #print name
        global currentName
        currentName = name
        f = open(IMAGEDIR+'/'+name, 'rb') # Open image file for reading (binary mode)
        tags = exifread.process_file(f) # get Exif tags
        f.close()
        return tags
    else:
        return loadNextImgExif(i, IMAGEDIR)

def getDateTimeOriginal(tags): # returns time picture was recorded
    orignalDateStr = tags['EXIF DateTimeOriginal'].values
    originalDate = datetime.datetime.strptime(orignalDateStr, DATETIMEFORMAT)
    return originalDate + datetime.timedelta(hours=-2) #UTC+2 used in images, all other calculations are done in UTC therfore substract 2 hours

def getInfos(gpx): # creates json with infos about gpx track e.g. uphill, downhill, distance etc.
    indentation = '   '
    infos = {}
    infos['uphill'], infos['downhill'] = gpx.get_uphill_downhill()
    infos['uphill'] = int(round(infos['uphill']))
    infos['downhill'] = int(round(infos['downhill']))
    #print('%sTotal uphill: %sm' % (indentation, infos['uphill']))
    #print('%sTotal downhill: %sm' % (indentation, infos['downhill']))
    infos['length_2d'] = round(gpx.length_2d()/1000., 2)
    infos['length_3d'] = round(gpx.length_3d()/1000., 2)
    #print('%sLength 2D: %s' % (indentation, infos['length_2d'] / 1000.))
    #print('%sLength 3D: %s' % (indentation, infos['length_3d'] / 1000.))
    #infos['start_time'], infos['end_time'] = gpx.get_time_bounds()
    #print('%sStarted: %s' % (indentation, infos['start_time']))
    #print('%sEnded: %s' % (indentation, infos['end_time']))

    return infos
            
#############################################################

def generateGeoJson(IMAGEDIR, ROUTE, OUTPUT, OUTPUTINFO):
    images = os.listdir(IMAGEDIR)
    imgIterator = iter(images)



    tags = loadNextImgExif(imgIterator, IMAGEDIR)
    #printAllTags(tags)
    orignalDate = getDateTimeOriginal(tags)

    try:
        gpx_file = open(ROUTE, 'r')
    except IOError:
        print "IOError: ", ROUTE, " does not exist"
        sys.exit(2)

    gpx = gpxpy.parse(gpx_file)

    infos = getInfos(gpx)
    infos['imageCount'] = 0

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
                        infos['imageCount'] += 1
                        #update next img
                        tags = loadNextImgExif(imgIterator, IMAGEDIR)
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

    geoJson = open(OUTPUT, "w")
    print 'write geojson to: ', OUTPUT
    geoJson.write(str(featureImgs))
    geoJson.close()

    infosJson = open(OUTPUTINFO, "w")
    print 'write info to: ', OUTPUTINFO
    infosJson.write(json.dumps(infos))
    infosJson.close()

if __name__ == "__main__":
    main(sys.argv[1:])
