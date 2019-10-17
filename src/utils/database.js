/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const diffHistory = require('mongoose-diff-history/diffHistory');
const uriFormat = require('mongodb-uri');

const GLOBALS = require('../../config/globals');
const logger = require('../logger');

const configurations = ['test', 'production', 'default', 'migration']; // todo move to config
const env = process.env.NODE_ENV || 'default';

if (!(configurations.includes(env))) {
	throw new Error('if defined, NODE_ENV must be set to test or production');
} else {
	logger.info(`NODE_ENV is set to ${env}`);
}

const config = require(`../../config/${env}.json`);

if (GLOBALS.DATABASE_AUDIT === 'true') {
	logger.info('database audit log enabled');
}

const encodeMongoURI = (urlString) => {
	if (urlString) {
		const parsed = uriFormat.parse(urlString);
		return uriFormat.format(parsed);
	}
	return urlString;
};

function enableAuditLog(schema, options) {
	if (GLOBALS.DATABASE_AUDIT === 'true') {
		// set database audit
		schema.plugin(diffHistory.plugin, options);
	}
}

function getConnectionOptions() {
	// read env params
	const {
		DB_URL = config.mongodb,
		DB_USERNAME,
		DB_PASSWORD,
	} = process.env;

	return {
		url: encodeMongoURI(DB_URL),
		username: encodeMongoURI(DB_USERNAME),
		password: encodeMongoURI(DB_PASSWORD),
	};
}

/**
 * creates the initial connection to a mongodb.
 * see https://mongoosejs.com/docs/connections.html#error-handling for error handling
 *
 * @returns {Promise} rejects on initial errors
 */
function connect() {
	mongoose.Promise = global.Promise;
	const options = getConnectionOptions();

	logger.info('connect to database host',
		options.url,
		options.username ? `with username ${options.username}` : 'without user',
		options.password ? 'and' : 'and without', 'password');

	return mongoose.connect(
		options.url,
		{ useNewUrlParser: true },
	).then((resolved) => {
		// handle errors that appear after connection setup
		mongoose.connection.on('error', (err) => {
			logger.error(err);
		});
		return resolved;
	});
}

function close() {
	return mongoose.connection.close();
}

module.exports = {
	connect,
	close,
	getConnectionOptions,
	enableAuditLog,
};
