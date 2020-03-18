/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const diffHistory = require('mongoose-diff-history/diffHistory');
const uriFormat = require('mongodb-uri');

const GLOBALS = require('../../config/globals');
const logger = require('../logger');

const configurations = ['test', 'production', 'default', 'migration']; // todo move to config
const env = process.env.NODE_ENV || 'default';

mongoose.Promise = global.Promise;

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

function addAuthenticationToOptions(DB_USERNAME, DB_PASSWORD, options) {
	const auth = {};
	if (DB_USERNAME) {
		auth.user = DB_USERNAME;
	}
	if (DB_PASSWORD) {
		auth.password = DB_PASSWORD;
	}
	if (DB_USERNAME || DB_PASSWORD) {
		options.auth = auth;
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
		url: DB_URL,
		username: DB_USERNAME,
		password: DB_PASSWORD,
	};
}

/**
 * Creates a Mongoose connection.
 * @async
 * @param {*} connector function to invoke with connection string an options.
 * Should be one of [mongoose.connect, mongoose.createConnection] or similar.
 * @param {*} [overrides={}] Optional Mongoose connection overrides
 * @returns {Promise} Promise that resolves with return value or rejects with error
 */
function createConnection(connector, overrides = {}) {
	const options = getConnectionOptions();

	logger.info('Connect to database host',
		options.url,
		options.username ? `with username ${options.username}` : 'without user',
		options.password ? 'and' : 'and without', 'password');

	const mongooseOptions = {
		autoIndex: env !== 'production',
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true,
		useUnifiedTopology: true,
		...overrides,
	};

	addAuthenticationToOptions(
		options.username,
		options.password,
		mongooseOptions,
	);

	return connector(
		encodeMongoURI(options.url),
		mongooseOptions,
	);
}

/**
 * Creates the default connection to MongoDB that will be used by Feathers Mongoose.
 * @async
 * @returns {Promise} resolves with connection, rejects on initial errors
 */
function connect() {
	return createConnection(mongoose.connect, {
		poolSize: GLOBALS.MONGOOSE_CONNECTION_POOL_SIZE,
	}).then(() => {
		// handle errors that appear after connection setup
		mongoose.connection.on('error', (err) => {
			logger.error(err);
		});
		return mongoose.connection;
	});
}

/**
 * Closes the default connection.
 * @returns {Promise} Promise that resolves when the connection has been closed
 */
function close() {
	return mongoose.connection.close();
}

module.exports = {
	createConnection,
	connect,
	close,
	getConnectionOptions,
	enableAuditLog,
};
