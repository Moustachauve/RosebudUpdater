var exports = module.exports = {}

var gtfs_sql = require('./gtfs_sql.js')
var fs = require('fs')
var path = require('path')
var log = require('../log/log.js')

var supportedFiles = "agency|calendar|calendar_dates|fare_attributes|fare_rules|feed_info|frequencies|routes|shapes|stop_times|stops|transfers|trips"

exports.parseFiles = function (feedInfo, directory, callback) {
	exports.getFileArray(directory, function (err, files) {
		if (err) {
			callback(err)
			return
		}
		
		if (files.length <= 0) {
			log.warn('No files to import to database "' + feedInfo.database_name + '"')
			callback()
			return
		}
		gtfs_sql.resetTransportDatabase(feedInfo, function (err, tempDatabase) {
			if (err) {
				callback(err)
				return
			}
			exports.parseFileRecursive(feedInfo, tempDatabase, directory, files, 0, function (err) {
				if (err) {
					callback(err)
					return
				}
				
				log.verbose('Loading files done. Switching old database and new one...')

				gtfs_sql.switchTempDatabase(feedInfo, tempDatabase, function (err) {
					if (err) {
						callback(err)
						return
					}

					callback()
				})
			})
		})
	})
}

exports.parseFileRecursive = function (feedInfo, tempDatabase, directory, fileArray, index, callback) {
	if (index >= fileArray.length) {
		callback()
		return
	}
	
	var currentFile = fileArray[index]
	var tableName = currentFile.substr(0, currentFile.lastIndexOf('.'))
	
	if (supportedFiles.indexOf(tableName) < 0) {
		log.warn('Found invalid file "' + currentFile + '" in directory "' + directory + '" for database "' + feedInfo.database_name + '"."')
		
		exports.parseFileRecursive(feedInfo, tempDatabase, directory, fileArray, index + 1, function (err) {
			callback(err)
			return
		})
		return
	}
	
	//MySQL doesn't like double backslash and relative paths
	var csvPath = path.dirname(require.main.filename) + '/' + directory + '/' + currentFile
	csvPath = csvPath.replace(/\\/g, '/')
	
	log.verbose('Parsing file "' + currentFile + '" into "' + tableName + '"...')
	
	gtfs_sql.injectCsvFile(feedInfo, tempDatabase, tableName, csvPath, function (err) {
		if (err) {
			callback(err)
			return
		}
		
		exports.parseFileRecursive(feedInfo, tempDatabase, directory, fileArray, index + 1, function (err) {
			callback(err)
			return
		})
	})
}

exports.getFileArray = function (directory, callback) {
	fs.readdir(directory, function (err, files) {
		if (err) {
			callback(err)
			return
		}
		
		callback(null, files)
	})
}