var exports = module.exports = {}

var sqlHelper = require('../sqlHelper/index.js')
var fs = require('fs')
var readline = require('readline')
var path = require('path')
var log = require('../log/log.js')

exports.resetTransportDatabase = function (feedInfo, callback) {
	
	log.verbose('Creating temporary database for "' + feedInfo.database_name + '"...')
	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query('CALL `my_bus`.`CreateGTFSTables`(?)', [feedInfo.feed_id], function (err, rows) {
		if (err) {
			callback(err)
			return
		}
		
		callback(null, rows[0][0].schemaNameTemp)
	})

}

exports.injectCsvFile = function (feedInfo, tempDatabase, table, csvPath, callback) {
	
	log.verbose('Reading csv header of file "' + table + '"...')
	
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
		
		exports.sanitizeColumnList(columns, table, tempDatabase, function (err, cleanColumns) {
			if (err) {
				callback(err)
				return
			}
			
			log.verbose('Injecting file "' + csvPath + '" in "' + tempDatabase + '.' + table + '"...')
			
			var sqlQuery = "START TRANSACTION; LOAD DATA LOCAL INFILE '" + csvPath + "'\n"
			sqlQuery += "INTO TABLE `" + tempDatabase + "`.`" + table + "`\n"
			sqlQuery += "CHARACTER SET UTF8 \n"
			sqlQuery += "FIELDS TERMINATED BY ','\n"
			sqlQuery += "OPTIONALLY ENCLOSED BY '\"'\n"
			sqlQuery += "ESCAPED BY '\"'\n"
			sqlQuery += "LINES TERMINATED BY '\n'\n"
			sqlQuery += "IGNORE 1 LINES\n"
			sqlQuery += "(" + cleanColumns + ")\n;COMMIT;"
			
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

exports.sanitizeColumnList = function (dirtyColumns, table, tempDatabase, callback) {
	
	log.verbose('Sanitizing columns for "' + table + '"...')
	var sqlCon = sqlHelper.getConnection()
	
	sqlCon.query("SELECT GROUP_CONCAT(DISTINCT `COLUMN_NAME` SEPARATOR '|') AS Columns FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N? AND TABLE_SCHEMA = N?", 
	[table, tempDatabase], { useArray: true }, 
	function (err, rows) {
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
	
	if (!isValid)
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

exports.switchTempDatabase = function (feedInfo, tempDatabase, callback) {

	var sqlCon = sqlHelper.getConnection()

	sqlCon.query("CALL `my_bus`.`RenameTempSchema`(?, ?)", [feedInfo.feed_id, tempDatabase], function (err, rows) {
		
		if (err) {
			callback(err)
			return
		}
		
		log.verbose('Switching database done.')
		callback()
	});
}