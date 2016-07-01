var _ = require('underscore');
var Backbone = require('backbone');
var util = require('../util');

module.exports = Backbone.Model.extend({

  initialize: function(attributes, options) {
    this.repo = attributes.repo;
    this.api = util.getApiFlavor();
  },

  defaults: {
    sha: '',
    commit: {},
    author: {},
  },

  parse: function (commit) {
    if (this.api === 'gitlab') {
      return {
        repo: this.repo,
        sha: commit.id,
        // TODO there is no author id in the gitlab api.
        // problematic for history sidebar.
        commit: {
          author: {
            name: commit.author_name,
            email: commit.author_email,
            date: commit.committed_date
          }
        }
      }
    }
    else {
      return {
        repo: this.repo,
        sha: commit.sha,
        commit: commit.commit,
        author: commit.author
      }
    }
  },

  url: function() {
    return this.repo.commitUrl(this.get('sha'));
  }
});
