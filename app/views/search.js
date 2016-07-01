var _ = require('underscore');
var Backbone = require('backbone');
var templates = require('../../templates');
var util = require('../util');

module.exports = Backbone.View.extend({
  template: templates.search,

  events: {
    'keyup input': 'keyup'
  },

  initialize: function(options) {
    this.mode = options.mode;
    this.model = options.model;
    return this;
  },

  render: function() {
    var placeholder = t('main.repos.filter');
    if (this.mode === 'repo') placeholder = t('main.repo.filter');
    this.$el.empty().append(this.template({
      placeholder: placeholder
    }));
    this.input = this.$el.find('input');
    this.input.focus();
    return this;
  },

  keyup: function(e) {
    if (e && e.which === 27) {
      // ESC key
      this.input.val('');
      this.trigger('search');
    } else if (e && e.which === 40) {
      // Down Arrow
      util.pageListing('down');
      e.preventDefault();
      e.stopPropagation();
      this.input.blur();
    } else {
      this.trigger('search');
    }
  },

  search: function() {
    var searchstr = this.input ? this.input.val() : '';
    return this.model.filter(function(model) {
      return model.get('name').indexOf(searchstr) > -1;
    });
  }
});
