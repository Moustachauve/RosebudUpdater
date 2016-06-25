var exports = module.exports = {}

var sqlConfig = require('./sqlConfig.json')
var sqlClient = require('mariasql')
var fs = require("fs")

var sqlCon

exports.hasInit = function () {
	if (sqlCon)
		return true

	return false
}

exports.init = function () {
	sqlCon = new sqlClient({
		host: sqlConfig.host,
		user: sqlConfig.user,
		password: sqlConfig.password,
		multiStatements: true,
		local_infile: true,
		charset: 'utf8'
	})
}

exports.end = function () {
	if (exports.hasInit())
		sqlCon.end()
}

exports.getConnection = function () {
	if (!exports.hasInit())
		throw "Can't get SqlConnection because the sqlHelper has not been initialized"

	return sqlCon
}

exports.executeSqlFromFile = function (filePath, sqlCon, callback) {
	fs.readFile(filePath, "utf-8", function (err, data) {
		if (err) {
			callback(err)
			return
		}
		
		if (!sqlCon)
			sqlCon = exports.getConnection()
				
		sqlCon.query(data, function (err, rows) {
			if (err) {
				callback(err)
				return
			}
			
			callback(null, rows)
		})
	})
}