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

  authenticate: function(options) {
    var match;

    if (cookie.get('oauth-token')) {
      if (_.isFunction(options.success)) options.success();
    } else {
      match = window.location.href.match(/\?code=([a-z0-9]*)/);

      if (match) {
        Backbone.$.ajax(auth.gatekeeper + '/authenticate/' + match[1], {
          success: function(data) {
            cookie.set('oauth-token', data.token);

            var regex = new RegExp("(?:\\/)?\\?code=" + match[1]);
            window.location.href = window.location.href.replace(regex, '');

            if (_.isFunction(options.success)) options.success();
          }
        });
      } else {
        if (_.isFunction(options.error)) options.error();
      }
    }
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
      return auth.api + ((token && _.isUndefined(id)) || (id && this.get('id') === id) ?
        '/user' : '/users/' + this.get('login'));
    }
  }
});
