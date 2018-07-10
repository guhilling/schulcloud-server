'use strict';

const globalHooks = require('../../../hooks');
const stripJs = require('strip-js');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const lesson = require('../model');
const errors = require('feathers-errors');

const checkIfCourseGroupLesson = (permission1, permission2, isCreating, hook) => {
	// find courseGroupId in different ways (POST, FIND ...)
	let groupPromise = isCreating ? Promise.resolve({courseGroupId: hook.data.courseGroupId}) : lesson.findOne({_id: hook.id}).then(lesson => {
		return JSON.stringify(lesson.courseGroupId) ? globalHooks.hasPermission(permission1)(hook) : globalHooks.hasPermission(permission2)(hook);
	});
};

const checkForShareToken = (hook) => {
	const {shareToken, lessonId} = hook.data;

	return lesson.findOne({_id: lessonId}).populate('courseId')
		.then(topic => {
			if (topic.shareToken == shareToken || topic.courseId.teacherIds.filter(t => t != hook.params.account.userId).length > 0)
				return hook;
			else
				throw new errors.Forbidden("The entered lesson doesn't belong to you or is not allowed to be shared!");
		})
};

exports.before = {
	all: [auth.hooks.authenticate('jwt'), (hook) => {
		if(hook.data && hook.data.contents) {
			hook.data.contents = (hook.data.contents || []).map((item) =>{
				item.user = item.user || hook.params.account.userId;
				switch (item.component) {
					case 'text':
						if (item.content && item.content.text) {
							item.content.text = stripJs(item.content.text);
						}
						break;
				}
				return item;
			});
		}
		return hook;
	}],
	find: [hooks.disable()],
	get: [hooks.disable()],
	create: [checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true), globalHooks.injectUserId, checkForShareToken],
	update: [hooks.disable()],
	patch: [hooks.disable()],
	remove: [hooks.disable()]
};

