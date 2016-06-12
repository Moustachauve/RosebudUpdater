var exports = module.exports = {}

var sqlHelper = require('../sqlHelper/index.js')
var fs = require('fs')
var readline = require('readline')
var path = require('path')
var log = require('../log/log.js')

exports.resetTransportDatabase = function (database, callback) {
	
	log.verbose('Reseting database "' + database + '"...')
	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query('DROP DATABASE IF EXISTS `' + database + '`;CREATE DATABASE `' + database + '`; USE `' + database + '`;', function (err, rows) {
		if (err) {
			callback(err)
			return
		}
		
		log.verbose('Creating tables for database "' + database + '"...')
		
		sqlHelper.executeSqlFromFile(path.resolve('./lib/gtfs/sql/gtfs_schema.sql'), sqlCon, function (err) {
			if (err) {
				callback(err)
				return
			}
			
			log.verbose('Tables successfuly created for "' + database + '".')
			
			callback()
		})
	})
}

exports.injectCsvFile = function (database, table, csvPath, callback) {
	
	log.verbose('Injecting file "' + csvPath + '" in "' + database + '.' + table + '"...')
	
	log.verbose('Reading csv header...')
	
	var columns = ''
	var firstTime = true
	
	var lineReader = readline.createInterface({
		input: fs.createReadStream(csvPath)
	})
	
	lineReader.on('line', function (line) {
		if (firstTime) {
			firstTime = false
			
			columns = line
		}
	})
	
	lineReader.on('close', function () {
		
		exports.sanitizeColumnList(columns, table, function (err, cleanColumns) {
			if (err) {
				callback(err)
				return
			}
			
			log.verbose('Inserting csv info into database...')
			
			var sqlQuery = "LOAD DATA LOCAL INFILE '" + csvPath + "'\n"
			sqlQuery += "INTO TABLE `" + table + "`\n"
			sqlQuery += "FIELDS TERMINATED BY ','\n"
			sqlQuery += "OPTIONALLY ENCLOSED BY '\"'\n"
			sqlQuery += "ESCAPED BY '\"'\n"
			sqlQuery += "LINES TERMINATED BY '\n'\n"
			sqlQuery += "IGNORE 1 LINES\n"
			sqlQuery += "(" + cleanColumns + ")\n;"
			
			var sqlCon = sqlHelper.getConnection()
			
			sqlCon.query(sqlQuery, function (err, rows) {
				if (err) {
					callback(err)
					return
				}
				
				log.verbose('Data insertion done.')
				
				callback()
			})
		})
	})
}

exports.sanitizeColumnList = function (dirtyColumns, table, callback) {
	
	log.verbose('Sanitizing columns for "' + table + '"...')
	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query("SELECT GROUP_CONCAT(DISTINCT `COLUMN_NAME` SEPARATOR '|') AS Columns FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N?", [table], { useArray: true }, function (err, rows) {
		if (err) {
			callback(err)
			return
		}
		
		//Replace is for weird and rare invisible ascii characters that could break the sql query
		var currentColumns = dirtyColumns.replace(/[\u200B-\u200D\uFEFF]/g, '').split(',')
		var allowedColumns = rows[0][0]
		
		for (var i = 0; i < currentColumns.length; i++) {
			if (!allowedColumns.includes(currentColumns[i])) {
				log.warn('Unknown column "' + currentColumns[i] + '"')
				currentColumns[i] = '@dummy'
			}
			else {
				currentColumns[i] = '`' + currentColumns[i] + '`'
			}
		}
		
		var cleanColumns = currentColumns.join(',')
		
		log.verbose('Column sanitization done.')
		callback(null, cleanColumns)
	})
}

exports.getFeeds = function (callback) {
	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query('SELECT `feed_id`, `database_name`, `url_gtfs` FROM `my_bus`.`feed`', function (err, rows) {
		if (err) {
			callback(err)
			return
		}
		
		if (!rows.info.numRows || rows.info.numRows <= 0) {
			callback('Aucun feed retourné depuis la base de donnée')
			return
		}
		
		callback(null, rows)
		
	})
}

exports.updateFeedInfoAfter = function (feed, isValid, duration, callback) {
	log.verbose('Updating feed information...')
	
	if(!isValid)
		log.error('Data for "' + feed.database_name + '" (' + feed.feed_id + ') was not valid, so it will not be visible to users.')

	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query('UPDATE `my_bus`.`feed` SET `data_valid` = :isValid, `last_edit` = `last_edit`, `last_update` = current_timestamp, `last_update_duration` = :duration WHERE `feed_id` = :id',
				{ isValid: isValid ? 1 : -1, duration: duration, id: feed.feed_id }, 
				function (err, rows) {
		if (err) {
			callback(err)
			return
		}
		
		if (!rows.info.numRows) {
			log.error('Infos for "' + feed.database_name + '" with id "' + feed.feed_id + '" was not be updated!')
		}
		
		callback()
		
	})
}

exports.updateFeedInfoBefore = function (feed, callback) {

	log.info('Updating "' + feed.database_name + '" (' + feed.feed_id + ')... It will not be visible to user while it is updating.')
	
	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query('UPDATE `my_bus`.`feed` SET `data_valid` = :isValid, `last_edit` = `last_edit`, `last_update` = current_timestamp WHERE `feed_id` = :id',
				{ isValid: 0, id: feed.feed_id }, 
				function (err, rows) {
		if (err) {
			callback(err)
			return
		}
		
		if (!rows.info.numRows) {
			log.error('Infos for "' + feed.database_name + '" with id "' + feed.feed_id + '" was not be updated!')
		}
		
		callback()
		
	})
}