const AbstractLDAPStrategy = require('./interface.js');

/**
 * General LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class GeneralLDAPStrategy extends AbstractLDAPStrategy {
	/**
     * @public
     * @see AbstractLDAPStrategy#getSchoolsQuery
     * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
     * @memberof GeneralLDAPStrategy
     */
	getSchools() {
		return Promise.resolve([{
			displayName: this.config.providerOptions.schoolName,
			ldapOu: this.config.rootPath,
		}]);
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#getUsers
     * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
     * (Array) roles = ['teacher', 'student', 'administrator']
     * @memberof GeneralLDAPStrategy
     */
	getUsers() {
		const {
			userAttributeNameMapping,
			userPathAdditions,
			roleType,
			roleAttributeNameMapping,
		} = this.config.providerOptions;

		const requiredAttributes = [
			userAttributeNameMapping.uuid,
			userAttributeNameMapping.mail,
		];
		const requiredFilters = requiredAttributes.map((attr) => `(${attr}=*)`).join('');
		const filter = `(&(objectClass=person)${requiredFilters})`;

		const options = {
			filter,
			scope: 'sub',
			attributes: [
				userAttributeNameMapping.givenName,
				userAttributeNameMapping.sn,
				userAttributeNameMapping.dn,
				userAttributeNameMapping.uuid,
				userAttributeNameMapping.uid,
				userAttributeNameMapping.mail,
				(roleType === 'group') ? 'memberOf' : userAttributeNameMapping.role,
			],
		};

		const rawAttributes = [userAttributeNameMapping.uuid];

		const searchArray = userPathAdditions.split(';;');

		searchArray.forEach((searchString, index) => {
			searchArray[index] = (searchString === '')
				? this.config.rootPath
				: `${searchString},${this.config.rootPath}`;
		});

		const promises = searchArray.map((searchPath) => (
			this.app.service('ldap').searchCollection(this.config, searchPath, options, rawAttributes)
		));
		return Promise.all(promises)
			.then((results) => results.reduce((all, result) => all.concat(result)), [])
			.then((data) => {
				const results = [];
				data.forEach((obj) => {
					const roles = [];
					if (roleType === 'group') {
						if (!Array.isArray(obj.memberOf)) {
							obj.memberOf = [obj.memberOf];
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleStudent)) {
							roles.push('student');
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleTeacher)) {
							roles.push('teacher');
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleAdmin)) {
							roles.push('administrator');
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleNoSc)) {
							return;
						}
					} else {
						if (obj[userAttributeNameMapping.role]
                            === roleAttributeNameMapping.roleStudent) {
							roles.push('student');
						}
						if (obj[userAttributeNameMapping.role]
                            === roleAttributeNameMapping.roleTeacher) {
							roles.push('teacher');
						}
						if (obj[userAttributeNameMapping.role]
                            === roleAttributeNameMapping.roleAdmin) {
							roles.push('administrator');
						}
						if (obj[userAttributeNameMapping.role]
                            === roleAttributeNameMapping.roleNoSc) {
							return;
						}
					}

					if (roles.length === 0) {
						return;
					}

					let firstName = obj[userAttributeNameMapping.givenName];
					if (!firstName) {
						if (roles.includes('administrator')) {
							firstName = 'Admin';
						} else if (roles.includes('teacher')) {
							firstName = 'Lehrkraft';
						} else {
							firstName = 'Schüler:in';
						}
					}

					results.push({
						email: obj[userAttributeNameMapping.mail],
						firstName,
						lastName: obj[userAttributeNameMapping.sn],
						roles,
						ldapDn: obj[userAttributeNameMapping.dn],
						ldapUUID: obj[userAttributeNameMapping.uuid],
						ldapUID: obj[userAttributeNameMapping.uid],
					});
				});
				return results;
			});
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#getClasses
     * @returns {Array} Array of Objects containing className, ldapDn, uniqueMember
     * @memberof GeneralLDAPStrategy
     */
	getClasses() {
		const {
			classAttributeNameMapping,
			classPathAdditions,
		} = this.config.providerOptions;

		if (classPathAdditions !== '') {
			const options = {
				filter: `${classAttributeNameMapping.description}=*`,
				scope: 'sub',
				attributes: [
					classAttributeNameMapping.dn,
					classAttributeNameMapping.description,
					classAttributeNameMapping.uniqueMember,
				],
			};
			const searchString = `${classPathAdditions},${this.config.rootPath}`;
			return this.app.service('ldap').searchCollection(this.config, searchString, options)
				.then((data) => data.map((obj) => ({
					className: obj[classAttributeNameMapping.description],
					ldapDn: obj[classAttributeNameMapping.dn],
					uniqueMembers: obj[classAttributeNameMapping.uniqueMember],
				})));
		}
		return Promise.resolve([]);
	}
}

module.exports = GeneralLDAPStrategy;
