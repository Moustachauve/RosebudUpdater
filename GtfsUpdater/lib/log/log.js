var winston = require('winston')
var mkdirp = require('mkdirp')

const LOG_DIRECTORY = './logs/'

winston.emitErrs = true;

mkdirp.sync(LOG_DIRECTORY)

var logger = new winston.Logger({
	transports: [
		new winston.transports.File({
			level: 'info',
			filename: LOG_DIRECTORY + 'all-logs.log',
			handleExceptions: true,
			json: true,
			maxsize: 5242880, //5MB
			maxFiles: 5,
			colorize: false
		}),
		new winston.transports.Console({
			level: 'debug',
			handleExceptions: true,
			humanReadableUnhandledException: true,
			json: false,
			colorize: true
		})
	],
	exitOnError: false
});

var exports = module.exports = logger;
exports.stream = {
	write: function (message, encoding) {
		logger.info(message);
	}
};