const auditLog = require('mongoose-audit-log').plugin;
const app = require('./app');

// default no user
module.exports = () => {
	auditLog.getUser = () => 'blah';
};

const port = app.get('port');
const server = app.listen(port);
const { logger } = app;

server.on('listening', () => {
	logger.log('info', `Schul-Cloud application started on http://${app.get('host')}:${port}`);
});
