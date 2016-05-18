var _ = require('underscore');
var Backbone = require('backbone');
var Branch = require('../models/branch');
var util = require('../util');

module.exports = Backbone.Collection.extend({
  model: Branch,

  initialize: function(models, options) {
    this.repo = options.repo;
  },

  parse: function(resp, options) {
    var gitlab = util.getApiFlavor() === 'gitlab';
    var repo = this.repo;
    return _.map(resp, (function(branch) {
      var commit = branch.commit;
      if (!commit.sha) {
        commit.sha = commit.id;
      }
      return {
        repo: repo,
        name: branch.name,
        commit: commit,
        'protected': gitlab ? branch['protected'] : branch.protection ? branch.protection.enabled : false
      }
    }));
  },

  /*
  fetch: function(options) {
    options = _.clone(options) || {};

    var cb = options.success;

    var success = (function(res, statusText, xhr) {
      this.add(res);
      util.parseLinkHeader(xhr, {
        success: success,
        complete: cb
      });
    }).bind(this);

    Backbone.Collection.prototype.fetch.call(this, _.extend(options, {
      success: (function(model, res, options) {
        util.parseLinkHeader(options.xhr, {
          success: success,
          error: cb
        });
      }).bind(this)
    }));
  },
  */

  url: function() {
    return this.repo.branchesUrl();
  }
});
