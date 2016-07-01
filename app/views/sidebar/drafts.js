var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../../templates');

module.exports = Backbone.View.extend({
  className: 'inner',

  template: templates.sidebar.drafts,

  initialize: function(options) {
    this.link = options.link;
    this.sidebar = options.sidebar;
  },

  render: function() {
    this.$el.html(this.template(this.link));

    this.sidebar.open();

    return this;
  }
});
