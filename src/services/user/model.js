'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gender = ['male', 'female', 'other', null];

const userSchema = new Schema({
	roles: [{type: Schema.Types.ObjectId, ref: 'role'}],
	email: {type: String, required: true, lowercase: true},

	schoolId: {type: Schema.Types.ObjectId, ref: 'school', required: true},

	firstName: {type: String, required: true},
	lastName: {type: String, required: true},

	gender: {type: String, enum: gender},
	birthday: {type: Date},

	children: [{type: Schema.Types.ObjectId, ref: 'user'}],
	parents: [{type: Schema.Types.ObjectId, ref: 'user'}],
	hasAnalogPrivacyConsent: {type: Boolean},

	preferences: {type: Object} // blackbox for frontend stuff like "cookies accepted"
},{
	timestamps: true
});

userSchema.methods.getPermissions = function() {
	const roleModel = require('../role/model');
	return roleModel.resolvePermissions(this.roles);
};

const registrationPinSchema = new Schema({
	email: {type: String, required: true},
	pin: {type: String},
}, {
	timestamps: true
});

const registrationPinModel = mongoose.model('registrationPin', registrationPinSchema);
const userModel = mongoose.model('user', userSchema);
module.exports = {
	userModel,
	registrationPinModel
};
