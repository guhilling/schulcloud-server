'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const helpdeskService = app.service('helpdesk');
const chai = require('chai');
const expect = require('chai').expect;
const logger = app.logger;

describe('helpdesk service', function() {

	const testProblem =
		{
			_id: '5836bb5664582c35df3bc214',
			subject: 'Dies ist ein Titel',
			currentTarget: 'Dies ist der CurrentState',
			targetState: 'Dies ist der TargetState',
			category: 'dashboard',
			schoolId: '5836bb5664582c35df3bc000'
		};
		

	before(function (done) {
		this.timeout(10000);
		helpdeskService.create(testProblem)
			.then(result => {
				done();
			});
	});


	after(function(done) {
		helpdeskService.remove(testProblem)
			.then(result => {
				done();
			}).catch((error) => {
				logger.info('Could not remove: ' + error);
				done();
			});
	});

	it('registered the helpdesk service', () => {
		assert.ok(helpdeskService);
	});

	it('POST /helpdesk with valid data', () => {

		let postBody = {
			subject: 'Dies ist ein Titel 2',
			currentTarget: 'Dies ist der CurrentState',
			targetState: 'Dies ist der TargetState',
			category: 'dashboard',
			schoolId: '5836bb5664582c35df3bc000'
		};

		return helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				expect(result.subject).to.equal('Dies ist ein Titel 2');
			}
		);
	});

	it('POST /helpdesk with invalid data', () => {

		let postBody = {
			subject: 'Dies ist ein Titel 3',
			currentTarget: 'Dies ist der CurrentState 2',
			targetState: 'Dies ist der TargetState 2',
			category: 'dashboard'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(400);
			}
		);
	});

	it('POST /helpdesk with invalid data regarding schoolID', () => {

		let postBody = {
			subject: 'Dies ist ein Titel 4',
			currentTarget: 'Dies ist der CurrentState 3',
			targetState: 'Dies ist der TargetState 3',
			category: 'dashboard',
			schoolId: '599ec0bb8e4e364ec18ff46c'
		};

		helpdeskService.create(postBody, { payload: {userId: '0000d213816abba584714c0a'}})
			.catch(err => {
				expect(err).to.not.be.undefined;
				expect(err.code).to.equal(403);
			}
		);
	});

	it('DELETE /helpdesk with user from same school', () => {

		helpdeskService.remove('5836bb5664582c35df3bc214', { payload: {userId: '0000d213816abba584714c0a'}})
			.then(result => {
				expect(result).to.not.be.undefined;
			}
		);

	});

	it('DELETE /helpdesk with user from different school', () => {

		helpdeskService.remove('5836bb5664582c35df3bc214', { payload: {userId: '599ec1688e4e364ec18ff46e'}})
			.catch(err => {
				expect(err).to.not.be.undefined;
				//The security hook adds the schoolid, and this does not match
				expect(err.code).to.equal(404);
			}
		);

	});


});

