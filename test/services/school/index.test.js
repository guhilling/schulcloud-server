'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');

describe('school service', function() {
  it('registered the schools services', () => {
    assert.ok(app.service('schools'));
  });
});

describe('years service', function() {
  it('registered the years services', () => {
    assert.ok(app.service('years'));
    assert.ok(app.service('gradeLevels'));
  });

  it('gets years', function() {
    return app.service('years').find()
      .then(years => {
        chai.expect(years[0]).to.have.property("name");
      })
  })
});