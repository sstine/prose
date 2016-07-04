var _ = require('underscore');
var marked = require('marked');
var Backbone = require('backbone');
var jsyaml = require('js-yaml');
var util = require('../util');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.api = options && options.api ? options.api : util.getApiFlavor()
    var attr = this.api === 'gitlab' ? this.pickGitlab(attributes) : attributes;
    Backbone.Model.call(this, attr, options);
  },

  pickGitlab: function (attr) {
    var id = attr.id || attr.blob_id;
    return _.extend({
      sha: id
    }, attr);
  },

  idAttribute: 'path',
  getPlaceholder: function () {
    return new Date().format('Y-m-d') + '-your-filename.md';
  },

  initialize: function(attributes, options) {
    options = options || {};
    var isNew = !attributes.sha && !this.get('sha');

    // Append placeholder name if file is new and
    // path is an empty string, matches _drafts
    // or matches a directory in collection
    var placeholder = this.getPlaceholder();
    var path = attributes.path.split('?')[0];
    var dir = attributes.collection.get(path);
    if (isNew && (!path || path === '_drafts' ||
      (dir && dir.get('type') === 'tree'))) {
      path = path ? path + '/' + placeholder : placeholder;
    }

    var extension = util.extension(path);
    var permissions = attributes.repo ?  attributes.repo.get('permissions')
      : undefined;
    var type = isNew || attributes.type === 'blob' ? 'file'
      : attributes.type;

    this.set({
      binary: util.isBinary(path),
      clone: !!options.clone,
      collection: attributes.collection,
      content: _.isUndefined(attributes.content) ? t('main.new.body') : attributes.content,
      content_url: attributes.url,

      // TODO I don't think we need this.
      draft: function() {
        var path = this.get('path');
        return util.draft(path);
      },
      extension: extension,
      lang: util.mode(extension),
      media: util.isMedia(extension),
      markdown: util.isMarkdown(extension),
      name: util.extractFilename(path)[1],
      oldpath: path,
      path: path,
      type: type,
      writable: permissions ? permissions.push : false
    });
  },

  get: function(attr) {
    // Return result of functions set on model
    var value = Backbone.Model.prototype.get.call(this, attr);
    return _.isFunction(value) ? value.call(this) : value;
  },

  isNew: function() {
    return this.get('sha') == null;
  },

  isClone: function() {
    return this.get('clone');
  },

  parse: function(resp) {
    resp = this.api === 'gitlab' ? this.pickGitlab(resp) : resp;
    var content = resp.content;
    if (content && resp.encoding === 'base64') {
      return _.extend({}, resp, this.parseContent(this.decode(content)));
    }
    else {
      return resp;
    }
  },

  parseContent: function(resp, options) {
    // Extract YAML from a post, trims whitespace
    resp = resp
      .replace(/\r\n/g, '\n') // normalize a little bit
      .replace(/\s*$/, '\n'); // trim (or append) so that EOF has exactly one \n

    var hasMetadata = !!util.hasMetadata(resp);

    if (!hasMetadata) return {
      content: resp,
      metadata: false,
      previous: resp
    };

    var res = {
      previous: resp
    };

    res.content = resp.replace(/^(---\n)((.|\n)*?)---\n?/, function(match, dashes, frontmatter) {
      var regex = /published: false/;

      try {
        // TODO: _.defaults for each key
        res.metadata = jsyaml.safeLoad(frontmatter);

        // Default to published unless explicitly set to false
        res.metadata.published = !regex.test(frontmatter);
      } catch(err) {
        console.log('ERROR encoding YAML');
        console.log(err);
      }

      return '';
    });

    return res;
  },

  // TODO figure out if these functions are still necessary -
  // possible that the API has changed and we don't need 'em.
  getContent: function(options) {
    options = options || {};
    Backbone.Model.prototype.fetch.call(this, _.extend({}, options, {
      dataType: 'text',
      headers: {
        'Accept': 'application/vnd.github.v3.raw'
      },
      url: this.get('content_url')
    }));
  },

  getContentSync: function(options) {
    options = options || {};
    return Backbone.Model.prototype.fetch.call(this, _.extend({}, options, {
      async: false,
      dataType: 'text',
      headers: {
        'Accept': 'application/vnd.github.v3.raw'
      },
      url: this.get('content_url')
    }));
  },

  serialize: function() {
    var metadata = this.get('metadata');
    var content = this.get('content') || '';
    var frontmatter;

    if (metadata) {
      try {
        frontmatter = jsyaml.safeDump(metadata).trim();
      } catch(err) {
        throw err;
      }
      return ['---', frontmatter, '---'].join('\n') + '\n' + content;
    } else {
      return content;
    }
  },

  encode: function(content) {
    // Encode UTF-8 to Base64
    // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
    return window.btoa(window.unescape(window.encodeURIComponent(content)));
  },

  decode: function(content) {
    // Decode Base64 to UTF-8
    // https://developer.mozilla.org/en-US/docs/Web/API/window.btoa#Unicode_Strings
    return window.decodeURIComponent(window.escape(window.atob(content)));
  },

  getAttributes: function() {
    var data = {};

    _.each(this.attributes, function(value, key) {
      data[key] = this.get(key);
    }, this);

    return data;
  },

  toJSON: function() {
    // Override toJSON method to only send necessary attributes
    var attr = this.attributes;
    var path = attr.path || attr.oldpath
    var content = attr.binary ? window.btoa(this.serialize())
      : this.encode(this.serialize());
    var message = attr.message || attr.placeholder;
    var branch = attr.branch.get('name');
    var data;

    if (this.api === 'gitlab') {
      data = {
        file_path: path,
        commit_message: message,
        content: content,
        branch_name: branch,
        encoding: 'base64'
      }
    }

    else {
      data = {
        path: path,
        message: messsage,
        content: content,
        branch: branch
      };
      var sha = attr.sha;
      if (sha) {
        data.sha = sha;
      }
    }

    return data;
  },

  clone: function(attributes, opts) {
    var options = { clone: true };
    if (opts) {
      options = _.extend({}, opts, options);
    }
    return new this.constructor(_.extend(_.pick(this.attributes, [
      'branch',
      'collection',
      'content',
      'metadata',
      'repo'
    ]), attributes), options);
  },

  save: function(options) {
    options = options || {};

    // TODO this might not be necessary:
    // http://backbonejs.org/docs/backbone.html#section-179
    //
    // Github takes PUT for new files and existing.
    // https://developer.github.com/v3/repos/contents/#create-a-file
    // https://developer.github.com/v3/repos/contents/#update-a-file
    // Gitlab takes POST for new files, PUT for existing.
    // http://doc.gitlab.com/ee/api/repository_files.html#create-new-file-in-repository
    // http://doc.gitlab.com/ee/api/repository_files.html#update-existing-file-in-repository
    var gitlab = this.api === 'gitlab';
    var isNew = this.isNew();
    var type = 'PUT';
    if (gitlab && isNew) {
      type = 'POST';
    }
    options.type = type;

    var success = options.success;
    options.success = function(model, res, options) {
      model.set(_.extend(res.content, {
        previous: model.serialize()
      }));
      if (_.isFunction(success)) success.apply(model, arguments);
    };

    // Call save method with undefined attributes
    Backbone.Model.prototype.save.call(this, undefined, options);
  },

  patch: function(options) {
    options = _.clone(options) || {};

    var success = options.success;
    var error = options.error;
    var collection = this.get('collection');

    collection.repo.fork({
      success: (function(repo, branch) {
        repo.ref({
          'ref': 'refs/heads/' + branch,
          'sha': collection.branch.get('sha'),
          'success': (function(res) {
            repo.branches.fetch({
              cache: false,
              success: (function(collection, res, options) {
                collection = repo.branches;
                branch = collection.findWhere({ name: branch });

                // Create new File model in forked repo
                // TODO: serialize metadata, set raw content
                var file = new module.exports({
                  branch: branch,
                  collection: collection,
                  content: this.get('content'),
                  path: this.get('path'),
                  repo: repo,
                  sha: this.get('sha'),
                  message: this.get('message') || this.get('placeholder'),
                  metadata: this.get('metadata'),
                  defaults: this.get('defaults')
                });

                // Add to collection on save
                file.save({
                  success: (function(model, res, options) {
                    // Update model attributes and add to collection
                    model.set(res.content);
                    branch.files.add(model);

                    $.ajax({
                      type: 'POST',
                      url: collection.repo.url() + '/pulls',
                      data: JSON.stringify({
                        title: res.commit.message,
                        body: 'This pull request has been automatically generated by prose.io.',
                        base: collection.branch.get('name'),
                        head: repo.get('owner').login + ':' + branch.get('name')
                      }),
                      success: success,
                      error: error
                    });
                  }).bind(this),
                  error: error
                });
              }).bind(this),
              error: error
            });
          }).bind(this),
          'error': error
        });
      }).bind(this),
      error: error
    });
  },

  destroy: function(options) {
    options = _.clone(options) || {};

    var path = this.get('path');

    var data = {
      path: path,
      message: t('actions.commits.deleted', { filename: path }),
      sha: this.get('sha'),
      branch: this.get('collection').branch.get('name')
    };

    var url = this.url().split('?')[0];
    var params = _.map(_.pairs(data), function(param) { return param.join('='); }).join('&');

    Backbone.Model.prototype.destroy.call(this, _.extend(options, {
      url: url + '?' + params,
      error: function(model, xhr, options) {
        // TODO: handle 422 Unprocessable Entity error
        console.log(model, xhr, options);
      },
      wait: true
    }));
  },

  url: function() {
    var collection = this.get('collection');
    return collection.repo.fileUrl(collection.branch.get('name'), this.get('path'))
  },

  validate: function(attributes) {
    // Path conflicts with another file in repo
    if (this.get('collection').where({ path: attributes.path }).length > 1) {
      return t('actions.save.fileNameExists');
    }

    // Name is still the default name
    var name = util.extractFilename(attributes.path)[1];
    if (name === this.getPlaceholder()) {
      return 'File name is default';
    }
  }
});
