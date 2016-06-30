var _ = require('underscore');
var Backbone = require('backbone');
var Commit = require('../models/commit');
var util = require('../util');

module.exports = Backbone.Collection.extend({
  model: Commit,

  initialize: function (models, options) {
    this.repo = options.repo;
  },

  setBranch: function (branch) {
    this.branch = branch;
  },

  parse: function (commits) {
    var repo = this.repo;
    _.each(commits, function (commit) {
      commit.repo = repo;
    });
    return commits;
  },

  url: function () {
    return this.repo.commitsUrl(this.branch);
  }
});
