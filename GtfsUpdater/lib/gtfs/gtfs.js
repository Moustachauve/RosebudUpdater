﻿var exports = module.exports = {}

var gtfs_get = require('./gtfs_get.js')
var gtfs_parse = require('./gtfs_parse.js')
var gtfs_sql = require('./gtfs_sql.js')
var log = require('../log/log.js')
var path = require('path')

const PATH_GTFS_FILE = 'gtfs/'

//const URL_DOWNLOAD = 'http://www.amt.qc.ca/xdata/citrous/google_transit.zip'
//const URL_DOWNLOAD = 'http://www.amt.qc.ca/xdata/express/google_transit.zip'
//const URL_DOWNLOAD = 'http://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip'


exports.import = function (feedInfo, callback) {
	
	gtfs_sql.updateFeedInfoBefore(feedInfo, function () {
		
		var start = process.hrtime()
		var destinationFolder = path.join(PATH_GTFS_FILE, feedInfo.database_name)
		var destinationFile = path.join(destinationFolder, 'gtfs.zip')
		var destinationUnzipFolder = path.join(destinationFolder, 'unzip')
		
		gtfs_get.get(feedInfo.url_gtfs, destinationFile, function (err) {
			if (err) {
				var elapsed = (process.hrtime(start)[0] * 1000) + (process.hrtime(start)[1] / 1000000)
				gtfs_sql.updateFeedInfoAfter(feedInfo, false, elapsed, function () {
					callback(err)
				})
				return
			}
			
			gtfs_get.unzip(destinationFile, destinationUnzipFolder, function (err) {
				if (err) {
					log.error('Could not unzip file "' + destinationFile + '": ' + err)
					var elapsed = (process.hrtime(start)[0] * 1000) + (process.hrtime(start)[1] / 1000000)
					gtfs_sql.updateFeedInfoAfter(feedInfo, false, elapsed, function () {
						callback()
					})
					return
				}
				
				gtfs_parse.parseFiles(feedInfo, destinationUnzipFolder, function (err) {
					if (err) {
						var elapsed = (process.hrtime(start)[0] * 1000) + (process.hrtime(start)[1] / 1000000)
						gtfs_sql.updateFeedInfoAfter(feedInfo, false, elapsed, function () {
							callback(err)
						})
						return
					}
					var elapsed = (process.hrtime(start)[0] * 1000) + (process.hrtime(start)[1] / 1000000)
					log.info('Importing "' + feedInfo.database_name + '" took ' + elapsed + 'ms')
					
					gtfs_sql.updateFeedInfoAfter(feedInfo, true, elapsed, function () {
						callback(null, elapsed)
					})
				})
			})
		})
	})
}

exports.importAll = function (callback) {
	
	var start = process.hrtime()
	log.info('Fetching all feeds...')
	
	gtfs_sql.getFeeds(function (err, feeds) {
		if (err) {
			callback(err)
			return
		}
		
		importAllRecursive(feeds, 0, function (err) {
			if (err) {
				callback(err)
				return
			}
			
			var elapsed = (process.hrtime(start)[0] * 1000) + (process.hrtime(start)[1] / 1000000)
			
			log.info('Fetching all feed done in ' + elapsed + 'ms.')
			
			callback()
		})
	})
}

var importAllRecursive = function (feeds, index, callback) {
	if (index >= feeds.length) {
		callback()
		return
	}
	
	log.verbose('Importing feed "' + feeds[index].database_name + '"...')
	
	exports.import(feeds[index], function (err) {
		if (err) {
			callback(err)
			return
		}
		
		importAllRecursive(feeds, index + 1, function (err) {
			callback(err)
			return
		})
	})
}
