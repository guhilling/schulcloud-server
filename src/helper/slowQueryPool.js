const mongoose = require('mongoose');

const logger = require('../logger');
const { createConnection } = require('../utils/database');

module.exports = async (app) => {
	app.slowQueryPool = await createConnection(mongoose.createConnection);
	app.slowQueryPool.on('error', (err) => {
		logger.error('Slow query pool error', { error: err });
	});
};
