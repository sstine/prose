var File = require('../../../app/models/file');
var Files = require('../../mocks/collections/files');
var spies = require('../../mocks/helpers').spies;
var fileMocker = require('../../mocks/models/file');
var filedata = require('../../fixtures/get-file-response.json');

// set some convenience variables
var fakePath = '/md.md';
var collection = new Files();

describe('file model', function() {
  var server, fileContents;

  before(function () { server = sinon.fakeServer.create(); });
  after(function () { server.restore(); });
  beforeEach(function() {
    // reset the DI state, so no File models are cached between tests.
    fileMocker.reset();
  })

  /*
  Create a mock File model and set up the fake server to respond to a fetch().
  Returns the mock file.
  */
  var filecount = 0;
  function  mockFile(content, data) {
    data = data || {};
    data.content = content;
    var file = fileMocker();
    var count = filecount += 1;
    server.respondWith('GET', file.url(), JSON.stringify(data));
    return file;
  }

  it('parses YAML frontmatter when present', function() {
    var content = 'my content',
        yaml = '---\nlayout: post\npublished: true\n---\n',
        file = mockFile(yaml + content, filedata);

    file.fetch();
    server.respond();

    expect(file.get('metadata')).to.deep.equal({
      layout: 'post',
      published: true
    });
  })

  describe('trailing whitespace', function() {
    var content = 'my content',
        extraspace = '\n\t  \t\t\n   \n\t\t \n',
        yaml = '---\nlayout: post\npublished: true\n---\n';

    function whitespaceTests(withYaml) {
      var fileContent = withYaml ? (yaml + content) : content;

      it('appends a single newline if not already present', function() {
        var file = mockFile(fileContent, filedata);
        file.fetch();
        server.respond();
        expect(file.get('content')).to.equal(content + '\n');
      });

      it('trims all EOF whitespace *except* single newline', function() {
        var file = mockFile(fileContent + extraspace, filedata)
        file.fetch();
        server.respond();
        expect(file.get('content')).to.equal(content + '\n');
      })

      it('does not trim EOL whitespace', function() {
        var content = 'line with EOL space     \nanother line\n';
        var file = mockFile(content, filedata);
        file.fetch();
        server.respond();
        expect(file.get('content')).to.equal(content);
      })
    }

    // run the tests both with and without yaml, since parsing code is different
    // for those two cases.
    describe('with frontmatter', whitespaceTests.bind(this, true));
    describe('without frontmatter', whitespaceTests.bind(this, false));
  })

  describe('new and clones', function () {
    it('tells you if it is new, a clone', function () {
      var file = new File({
        path: fakePath,
        collection: collection
      });
      expect(file.isClone()).not.ok;
      expect(file.isNew()).ok;
      var clone = file.clone({ path: fakePath });
      expect(clone.isClone()).ok;
    });
  });

  describe('validation', function () {
    it('validates against placeholder', function () {
      var file = new File({
        path: fakePath,
        collection: collection
      });
      expect(file.validate({ path: '/' + file.getPlaceholder() })).ok;
    });
  });

});
