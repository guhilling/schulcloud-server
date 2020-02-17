/* eslint-disable no-unused-expressions */

const { expect } = require('chai');

const JiraConnector = require('jira-connector');
const { JIRA_URL } = require('../../../../config/globals'); // todo move to config

const client = new JiraConnector({
	host: JIRA_URL,
	basic_auth: {
		username: '***',
		password: '***',
	},
});

const issueKeys = [];

const issueData = {
	fields: {
		summary: '[TEST] issue summary created by an automated test',
		description: 'A issue description\nIn two lines...',
		project: { key: 'JHD' },
		issuetype: {
			name: 'Support',
		},
	},
};

describe.only('jira connector', () => {
	it('fetch default issue', () => client.issue.getIssue({ issueKey: 'SC-2' })
		.then((issue) => {
			expect(issue.fields.summary).to.be.not.empty;
			expect(issue.fields.description).to.be.not.empty;
			return issue;
		}));
	it('create and remove service desk (JHD) issue', async (done) => {
		const issueKey = await client.issue.createIssue(issueData)
			.then((response) => {
				expect(response.key).to.be.not.empty;
				expect(response.id).to.be.not.empty;
				return response.key;
			});
		issueKeys.push(issueKey);
		done();
	});
	it('create service desk (JHD) issue with different author', async (done) => {
		const reporter = { name: 'wallboard' };
		const issueFromDifferentAuthorData = Object.assign({}, {
			reporter,
		}, issueData);
		const issueKey = await client.issue.createIssue(issueFromDifferentAuthorData)
			.then((response) => {
				expect(response.key).to.be.not.empty;
				expect(response.id).to.be.not.empty;
				return response.key;
			});
		issueKeys.push(issueKey);
		await client.issue.getIssue({ issueKey })
			.then((issue) => {
				expect(issue.fields.reporter.name, 'creator should match the given user')
					.to.be.equal(reporter.name);
				done();
			});
	});
	it('create service desk (JHD) issue with creating a new author', async () => {

	});
	after('remove created tickets', () => Promise.all(issueKeys
		.map((issueKey) => client.issue.deleteIssue({ issueKey }))));
});
