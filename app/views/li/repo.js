var _ = require('underscore');
var Backbone = require('backbone');
var cookie = require('../../cookie');
var templates = require('../../../templates');

module.exports = Backbone.View.extend({
  tagName: 'li',

  className: 'item clearfix',

  template: templates.li.repo,

  initialize: function(options) {
    this.model = options.model;
    this.$el.attr('data-index', options.index);
    this.$el.attr('data-id', this.model.id);
    this.$el.attr('data-navigate', '#' + this.model.get('owner').login + '/' + this.model.get('name'));
  },

  render: function() {
    this.$el.empty().append(this.template(_.extend({}, this.model.attributes, {
      login: cookie.get('login')
    })));
    return this;
  }
});
