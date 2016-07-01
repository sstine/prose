var _ = require('underscore');
var Backbone = require('backbone');
var Org = require('../models/org');
var auth = require('../config');
var util = require('../util');

module.exports = Backbone.Collection.extend({
  model: Org,

  initialize: function(models, options) {
    options = _.clone(options) || {};
    this.user = options.user;
    this.api = util.getApiFlavor();
  },

  parse: function (res) {
    if (this.api === 'gitlab') {
      res.forEach(function (org) {
        org.login = org.path;
      });
    }
    return res;
  },

  url: function() {
    if (this.api === 'gitlab') {
      return auth.api + '/groups';
    }
    else {
      return this.user ? auth.api + '/users/' + this.user.get('login') + '/orgs' : '/user/orgs';
    }
  }
});
