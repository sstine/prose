var _ = require('underscore');
var url = require('url');
var Backbone = require('backbone');
var Repo = require('../models/repo');

var auth = require('../config');
var cookie = require('../cookie');

var util = require('../util');

module.exports = Backbone.Collection.extend({
  model: Repo,

  initialize: function(models, options) {
    this.user = options.user;

    this.comparator = function(repo) {
      return -(new Date(repo.get('updated_at')).getTime());
    };

    this.api = util.getApiFlavor();
  },

  /*
   * TODO look at headers for next pagination links.
  fetch: function(opts) {
    var options = _.clone(opts) || {};

    var cb = options.success;

    var success = (function(res, statusText, xhr) {
      this.add(res);
      util.parseLinkHeader(xhr, {
        success: success,
        complete: cb
      });
    }).bind(this);

    Backbone.Collection.prototype.fetch.call(this, _.extend(options, {
      api: this.api, // pass api flavor to models
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
    var id = cookie.get('id');
    var type = this.user.get('type');

    if (this.api === 'gitlab') {
      var scope = cookie.get('scope');
      var query = {};
      if (scope === 'public_repo') {
        query.scope = 'public';
      }
      return auth.api + '/projects' + url.format({query: query});
    }

    else {
      var path;
      switch(type) {
        case 'User':
          path = (id && this.user.get('id') === id) ? '/user' :
            ('/users/' + this.user.get('login'))
          break;
        case 'Organization':
          path = '/orgs/' + this.user.get('login');
          break;
      }
      return auth.api + path + '/repos?per_page=100';
    }
  }
});
