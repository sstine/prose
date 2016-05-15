var _ = require('underscore');
var User = require('../../../app/models/user');


describe('models set defaults', function () {
  it('sets defaults on User', function () {
    var model = new User({});
    expect(_.difference(['login', 'id', 'type', 'avatar_url'], _.keys(model.attributes)).length).not.ok;
  });
  it('includes a login property on User', function () {
    var model = new User({});
    model.api = 'gitlab';
    var parsed = model.parse({});
    expect(parsed.hasOwnProperty('login')).to.ok;
  });
});
