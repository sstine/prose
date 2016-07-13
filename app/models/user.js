var _ = require('underscore');

var Backbone = require('backbone');
var Repos = require('../collections/repos');
var Orgs = require('../collections/orgs');
var auth = require('../config');
var cookie = require('../cookie');
var util = require('../util');

module.exports = Backbone.Model.extend({
  defaults: {
    login: '',
    id: 0,
    type: 'User', // User or Organization
    avatar_url: ''
  },

  initialize: function(attributes, options) {
    this.repos = new Repos([], { user: this });
    this.orgs = new Orgs([], { user: this });
    this.api = util.getApiFlavor();
  },

  parse: function (resp) {
    if (this.api === 'gitlab') {
      return _.extend(resp, {
        login: resp.username
      });
    } else {
      return resp;
    }
  },

  url: function() {
    var id = cookie.get('id');
    var token = cookie.get('oauth-token');
    if (this.api === 'gitlab') {
      return auth.api + '/user';
    } else {
      // Return '/user' if authenticated but no user id cookie has been set yet
      // or if this model's id matches authenticated user id
      var prefix = token && !id || id && this.get('id') === id ? '/user' :
        '/users/' + this.get('login');
      return auth.api + prefix;
    }
  }
});
