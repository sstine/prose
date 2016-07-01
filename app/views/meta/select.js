var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var templates = require('../../../templates');

module.exports = Backbone.View.extend({

  template: templates.meta.select,
  type: 'select',

  initialize: function(options) {
    this.name = options.data.name;
    this.options = options;
  },

  render: function () {
    var data = this.options.data;
    var select = {
      name: data.name,
      label: data.field.label,
      help: data.field.help,
      placeholder: data.field.placeholder,
      options: data.field.options,
      lang: data.lang
    };

    this.setElement($(this.template(select)));
    this.$form = this.$el.find('select');
    return this.$el;
  },

  getValue: function() {
    var val = this.$form.val();
    if (!val && val !== 0) {
      return '';
    }
    return val;
  },

  setValue: function(value) {
    var $el = this.$el;
    var $form = this.$form;
    if (_.isArray(value)) {
      value = value[0];
    }
    if (!value && value !== 0) {
      $el.find('option').each(function () {
        $(this).attr('selected', false);
      });
    }
    else {
      var match = $el.find('option[value="' + value + '"]');
      if (match.length) {
        match.attr('selected', 'selected');
        $form.trigger('liszt:updated');
      }
      else {
        $form.append($('<option />', {selected: 'selected', value: value, text: value}));
      }
    }
    $form.trigger('liszt:updated');
  }
});
