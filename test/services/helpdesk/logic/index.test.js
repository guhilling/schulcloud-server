const { JIRA_URL } = require('../../../../config/globals');

if (JIRA_URL) {
	require('./jiraclient');
}
