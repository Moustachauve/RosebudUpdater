var http = require('http')
var path = require('path')
var gtfs = require('./lib/gtfs/gtfs.js')
var sqlHelper = require('./lib/sqlHelper/index.js')
var log = require('./lib/log/log.js')

log.info('Starting GTFS Updater...')
sqlHelper.init()

gtfs.importAll(function (err) {
	if (err) throw err
	
	log.info('GTFS Updater done working.')

	process.exit()
})
