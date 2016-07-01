var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../templates');

module.exports = Backbone.View.extend({
  className: 'modal overlay',

  template: templates.modal,

  events: {
    'click .got-it': 'confirm'
  },

  initialize: function() {
    this.message = this.options.message;
  },

  render: function() {
    this.$el.empty().append(templates.modal({
      message: this.message
    }));
    return this;
  },

  confirm: function() {
    var view = this;
    this.$el.fadeOut('fast', function() {
      view.remove();
    });
    return false;
  }
});
