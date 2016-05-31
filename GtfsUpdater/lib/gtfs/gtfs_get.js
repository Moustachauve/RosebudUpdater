var exports = module.exports = {}

var request = require('request')

var yauzl = require("yauzl")
var fs = require('fs')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var path = require('path')
var log = require('../log/log.js')

exports.get = function (url, saveLocation, callback) {
	
	log.verbose('Getting GTFS zip from "' + url + '" to "' + saveLocation + '"...')

	var saveFolder = path.dirname(saveLocation)
	
	log.verbose('Clearing "' + saveFolder + '"...')
	
	rimraf(saveFolder, function (err) {
		if (err) {
			callback(err)
			return
		}
		log.verbose('Creating "' + saveFolder + '"...')

		mkdirp(saveFolder, '0777', function (err) {
			if (err) {
				callback(err)
				return
			}
			
			log.verbose('Downloading "' + url + '" to "' + saveLocation + '"...')

			request(url)
        .pipe(fs.createWriteStream(saveLocation))
        .on('close', function (err) {
				if (err) {
					callback(err)
					return
				}
				
				log.verbose('Download done.')

				callback(null, saveLocation)
			})
		})
	})
}

exports.unzip = function (fileLocation, unzipLocation, callback) {
	
	log.verbose('Creating unzip target for gtfs file at "' + unzipLocation + '"...')

	mkdirp(unzipLocation, '0777', function (err) {
		if (err) {
			callback(err)
			return
		}
		
		unzipLocation = path.normalize(unzipLocation + path.sep)
		
		log.verbose('Unziping file at "' + unzipLocation + '"...')
		
		yauzl.open(fileLocation, { lazyEntries: true }, function (err, zipfile) {
			if (err) {
				callback(err)
				return
			}

			zipfile.readEntry()
			zipfile.on('entry', function (entry) {
				if (/\/$/.test(entry.fileName)) {
					// directory file names end with '/' 
					mkdirp(path.normalize(unzipLocation + entry.fileName), function (err) {
						if (err) {
							callback(err)
							return
						}
						
						zipfile.readEntry()
					})
				} else {
					// file entry 
					zipfile.openReadStream(entry, function (err, readStream) {
						if (err) {
							callback(err)
							return
						}
						// ensure parent directory exists 
						mkdirp(path.normalize(unzipLocation + path.dirname(entry.fileName)), function (err) {
							if (err) {
								callback(err)
								return
							}

							readStream.pipe(fs.createWriteStream(unzipLocation + entry.fileName))
							readStream.on('end', function () {
								zipfile.readEntry()
							})
						})
					})
				}
			})
			
			zipfile.once('error', function (err) {
				log.error('Error while unziping "' + fileLocation + '": ' + err)
			})

			zipfile.once('end', function (entry) {
				log.verbose('Unzipping done.')
				callback(null)
			})
		})
	})
}