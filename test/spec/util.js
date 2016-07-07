var util = require('../../app/util');
var auth = require('../../app/config');

describe('Utility functions', function () {

  it('assigns the right api flavor', function () {
    auth.gitlab = true;
    expect(util.getApiFlavor()).to.eql('gitlab');
    auth.gitlab = null;
    expect(util.getApiFlavor()).to.eql('github');
  });
});
