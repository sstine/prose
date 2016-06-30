var util = require('../../app/util');
var auth = require('../../app/config');

describe('Utility functions', function () {

  it('assigns the right api flavor', function () {
    expect(util.getApiFlavor('api.github.com/v3')).to.eql('github');
    expect(util.getApiFlavor('rainbow-unicorn-gitlab.com/api/v3')).to.eql('gitlab');
    expect(util.getApiFlavor('no-api-here-should-default-to-geeeeee-tuh-hub')).to.eql('github');
    expect(util.getApiFlavor(null)).to.eql(util.getApiFlavor(auth.api));
  });
});
