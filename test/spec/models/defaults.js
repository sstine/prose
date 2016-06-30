var _ = require('underscore');
var User = require('../../../app/models/user');

describe('models set defaults', function () {
  it('includes a login property on User', function () {
    var model = new User({});
    model.api = 'gitlab';
    var parsed = model.parse({});
    expect(parsed.hasOwnProperty('login')).to.ok;
  });
});
