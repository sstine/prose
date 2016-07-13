
// boot the app
require('../../app/index.js');

describe('application bootstrap', function() {

  var server;
  before(function() { server = sinon.fakeServer.create(); });
  after(function() { server.restore(); })

  it('should expose window.router', function() {
    expect(router).to.be.ok;
  });
});
