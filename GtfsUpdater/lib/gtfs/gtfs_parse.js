var exports = module.exports = {}

var gtfs_sql = require('./gtfs_sql.js')
var fs = require('fs')
var path = require('path')
var log = require('../log/log.js')

var supportedFiles = "agency|calendar|calendar_dates|fare_attributes|fare_rules|feed_info|frequencies|routes|shapes|stop_times|stops|transfers|trips"

exports.parseFiles = function (database, directory, callback) {
	gtfs_sql.resetTransportDatabase(database, function (err) {
		if (err) {
			callback(err)
			return
		}
		
		exports.getFileArray(directory, function (err, files) {
			if (err) {
				callback(err)
				return
			}
			
			if (files.length <= 0) {
				log.warn('No files to import to database "' + database + '"')
				callback()
				return
			}
			
			exports.parseFileRecursive(database, directory, files, 0, function (err) {
				if (err) {
					callback(err)
					return
				}

				callback()
			})
		})
	})
}

exports.parseFileRecursive = function (database, directory, fileArray, index, callback) {
	if(index >= fileArray.length) {
		callback()
		return
	}
	
	var currentFile = fileArray[index]
	var tableName = currentFile.substr(0, currentFile.lastIndexOf('.'))
	
	if (supportedFiles.indexOf(tableName) < 0) {
		log.warn('Found invalid file "' + currentFile + '" in directory "' + directory + '" for database "' + database + '"."')

		exports.parseFileRecursive(database, directory, fileArray, index + 1, function (err) {
			callback(err)
			return
		})
		return
	}
	
	//MySQL doesn't like double backslash and relative paths
	var csvPath = path.dirname(require.main.filename) + '/' + directory + '/' + currentFile
	csvPath = csvPath.replace(/\\/g, '/')
			
	log.verbose('Parsing file "' + currentFile + '" into "' + tableName + '"...')

	gtfs_sql.injectCsvFile(database, tableName, csvPath, function (err) {
		if (err) {
			callback(err)
			return
		}
		
		exports.parseFileRecursive(database, directory, fileArray, index + 1, function (err) {
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