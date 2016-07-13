var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var auth = require('../config');
var util = require('../util');
var templates = require('../../templates');
var cookie = require('../cookie');

// Set scope
auth.scope = cookie.get('scope') || 'repo';

module.exports = Backbone.View.extend({
  template: templates.nav,

  events: {
    'click a.edit': 'emit',
    'click a.preview': 'emit',
    'click a.meta': 'emit',
    'click a.settings': 'emit',
    'click a.save': 'emit',
    'click .mobile .toggle': 'toggleMobile'
  },

  initialize: function(options) {
    this.app = options.app;
    this.sidebar = options.sidebar;
    this.user = options.user;
  },

  render: function() {
    this.$el.html(this.template({
      login: util.oauthUrl(util.getApiFlavor(), auth.scope)
    }));
    this.$save = this.$el.find('.file .save .popup');
    return this;
  },

  emit: function(e) {
    // TODO: get rid of this hack exception
    if (e && !$(e.currentTarget).hasClass('preview')) e.preventDefault();

    var state = $(e.currentTarget).data('state');
    if ($(e.currentTarget).hasClass('active')) {
      // return to file state
      state = this.state;
    }

    this.active(state);
    this.toggle(state, e);
  },

  setFileState: function(state) {
    this.state = state;
    this.active(state);
  },

  updateState: function(label, classes, kill) {

    if (!label) label = t('navigation.save');
    this.$save.html(label);

    // Add, remove classes to the file nav group
    this.$el.find('.file')
      .removeClass('error saving saved save')
      .addClass(classes);

    if (kill) {
      _.delay((function() {
        this.$el.find('.file').removeClass(classes);
      }).bind(this), 1000);
    }
  },

  mode: function(mode) {
    this.$el.attr('class', mode);
  },

  active: function(state) {
    // Coerce 'new' to 'edit' to activate correct icon
    state = (state === 'new' ? 'edit' : state);
    this.$el.find('.file a').removeClass('active');
    this.$el.find('.file a[data-state=' + state + ']').toggleClass('active');
  },

  toggle: function(state, e) {
    this.trigger(state, e);
  },

  toggleMobile: function(e) {
    this.sidebar.toggleMobile();
    $(e.target).toggleClass('active');
    return false;
  }
});
