const amqp = require('amqplib');
const shortId = require('shortid');

const Syncer = require('./Syncer');

/**
 * Implements asynchronously importing CSV documents based on the Syncer interface.
 * Import jobs are created on a job queue via AMQP and consumed by an external service.
 * @class CSVAsyncer
 * @implements {Syncer}
 */
class CSVAsyncer extends Syncer {
	constructor(app, stats = {}, options = {}, requestParams = {}) {
		super(app, stats);

		this.options = options;
		this.requestParams = requestParams;
	}

	/**
     * @see {Syncer#respondsTo}
     */
	static respondsTo(target) {
		return target === 'csv-async';
	}

	/**
     * @see {Syncer#params}
     */
	static params(params, data = {}) {
		const query = (params || {}).query || {};
		if (query.school && data.data) {
			return [
				{
					// required
					schoolId: query.school,
					csvData: data.data,
					// optional
					role: query.role || 'student',
					sendEmails: query.sendEmails === 'true',
					schoolYear: query.schoolYear,
				},
				params,
			];
		}
		return false;
	}

	/**
     * @see {Syncer#steps}
     */
	async steps() {
		await super.steps();
		const connection = await amqp.connect('amqp://localhost');
		const channel = await connection.createChannel();
		const queueName = 'sc-import-jobs';
		channel.assertQueue(queueName, {
			durable: true,
		});
		const job = {
			id: shortId.generate(),
			...this.options,
		};
		channel.sendToQueue(queueName, Buffer.from(JSON.stringify(job)));
		this.stats.success = true;
		this.stats.jobId = job.id;
		this.stats.statusUrl = `http://localhost:4444/${job.id}`;
		return this.stats;
	}
}

module.exports = CSVAsyncer;
