var util = require('../../app/util');
var config = require('../../app/config');

describe('Utility functions', function () {

  it('assigns the right api flavor', function () {
    config.gitlab = true;
    expect(util.getApiFlavor()).to.eql('gitlab');
    config.gitlab = null;
    expect(util.getApiFlavor()).to.eql('github');
  });

  it('returns the gitlab oauth urls', function () {
    var url = util.oauthUrl('gitlab');
    expect(/response_type=code/.test(url)).ok;
    expect(/https/.test(url)).ok;
    url = util.oauthUrl(null, 'foo');
    expect(/scope=foo/.test(url)).ok;
    expect(/https/.test(url)).ok;
  });
});
