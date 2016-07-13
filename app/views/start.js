var Backbone = require('backbone');
var $ = Backbone.$;
var templates = require('../../templates');
var auth = require('../config');
var cookie = require('../cookie');
var util = require('../util');

// Set scope
auth.scope = cookie.get('scope') || 'repo';

module.exports = Backbone.View.extend({
  id: 'start',

  events: {
    'click a[href="#scopes"]': 'toggleScope',
    'change .toggle-hide select': 'setScope'
  },

  template: templates.start,

  render: function() {
    this.$el.html(this.template({
      scope: auth.scope,
      oauth: util.oauthUrl(util.getApiFlavor(), auth.scope)
    }));
    return this;
  },

  toggleScope: function(e) {
    e.preventDefault();
    this.$('.toggle-hide').toggleClass('show');
  },

  setScope: function(e) {
    var scope = $(e.currentTarget).val(),
        expire = new Date((new Date()).setYear((new Date()).getFullYear() + 20));
    auth.scope = scope;
    cookie.set('scope', scope, expire);
    this.render();
    router.app.nav.render();
  }
});
