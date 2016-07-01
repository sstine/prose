var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../templates');

module.exports = Backbone.View.extend({

  template: templates.meta.text,
  type: 'text',

  initialize: function(options) {
    this.options = options;
    this.name = options.data.name;
  },

  render: function () {
    var data = this.options.data;

    var text = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      value: data.field.value,
      placeholder: data.field.placeholder,
      type: data.type
    };

    this.setElement($(this.template(text)));
    this.$form = this.$el.find('input');
    return this.$el;
  },

  getValue: function() {
    return this.options.data.type === 'number' ?
      Number(this.$form.val()) : this.$form.val();
  },

  setValue: function(value) {
    this.$form.val(value);
  }

});
