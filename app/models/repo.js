var _ = require('underscore');
var Backbone = require('backbone');
var Branches = require('../collections/branches');
var Commits = require('../collections/commits');
var config = require('../config');
var util = require('../util');

module.exports = Backbone.Model.extend({
  constructor: function(attributes, options) {
    this.api = options && options.api ? options.api : util.getApiFlavor();
    var attr = this.api === 'gitlab' ? this.pickGitlab(attributes) :
      this.pickGithub(attributes);

    Backbone.Model.call(this, attr);
  },

  pickGitlab: function (attr) {
    return {
      id: attr.id,
      description: attr.description,

      // Gitlab API does not have a boolean value for whether the
      // project is a fork; only how many forks the project has.
      fork: false,
      homepage: attr.web_url,
      default_branch: attr.default_branch,
      name: attr.name,
      owner: {
        id: attr.owner ? attr.owner.id : attr.namespace ? attr.namespace.owner_id : '',
        login: attr.owner ? attr.owner.username : attr.namespace ? attr.namespace.name : ''
      },
      permissions: attr.permissions,
      private: !attr.public,
      updated_at: attr.last_activity_at
    };
  },

  pickGithub: function (attr) {
    return {
      id: attr.id,
      description: attr.description,
      fork: attr.fork,
      homepage: attr.homepage,
      default_branch: attr.default_branch,
      name: attr.name,
      owner: {
        id: attr.owner.id,
        login: attr.owner.login
      },
      permissions: attr.permissions,
      private: attr.private,
      updated_at: attr.updated_at,
      issue_count: attr.open_issues_count
    };
  },

  initialize: function () {
    this.branches = new Branches([], { repo: this });
    this.commits = new Commits([], { repo: this, branch: this.branch })
  },

  ref: function(options) {
    options = _.clone(options) || {};

    $.ajax({
      type: 'POST',
      url: this.url() + '/git/refs',
      data: JSON.stringify({
        ref: options.ref,
        sha: options.sha
      }),
      success: options.success,
      error: options.error
    });
  },

  fork: function(options) {
    options = _.clone(options) || {};

    var success = options.success;

    $.ajax({
      type: 'POST',
      url: this.url() + '/forks',
      success: (function(res) {
        // Initialize new Repo model
        // TODO: is referencing module.exports in this manner acceptable?
        var repo = new module.exports(res);

        // TODO: Forking is async, retry if request fails
        repo.branches.fetch({
          success: (function(collection, res, options) {
            collection = repo.branches;
            var prefix = 'prose-patch-';

            var branches = collection.filter(function(model) {
              return model.get('name').indexOf(prefix) === 0;
            }).map(function(model) {
              return parseInt(model.get('name').split(prefix)[1]);
            });

            var branch = prefix + (branches.length ? _.max(branches) + 1 : 1);

            if (_.isFunction(success)) success(repo, branch);
          }).bind(this),
          error: options.error
        })
      }).bind(this),
      error: options.error
    });
  },

  url: function() {
    if (this.api === 'gitlab') {
      return config.api + '/projects/' + this.get('id');
    } else {
      return config.api + '/repos/' + this.get('owner').login +
        '/' + this.get('name');
    }
  }
});
