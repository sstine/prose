var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BranchView = require('./branch');
var templates = require('../../../templates');

module.exports = Backbone.View.extend({
  template: templates.sidebar.branches,

  subviews: {},

  initialize: function(options) {
    var app = options.app;
    app.loader.start();

    this.app = app;
    this.model = options.model;
    this.repo = options.repo;
    this.branch = options.branch || this.repo.get('default_branch');
    this.router = options.router;
    this.sidebar = options.sidebar;

    this.listenTo(this.model, 'change', this.render);
    this.model.fetch({
      error: function(model, xhr) {
        options.router.error(xhr);
      },
      complete: function () {
        app.loader.done ();
      }
    });
  },

  render: function() {
    // only render branches selector if two or more branches
    if (this.model.length < 2) return;

    this.app.loader.start();

    this.$el.empty().append(this.template({}));
    var frag = document.createDocumentFragment();

    this.model.each((function(branch, index) {
      var view = new BranchView({
        model: branch,
        repo: this.repo,
        branch: this.branch
      });

      frag.appendChild(view.render().el);
      this.subviews[branch.get('name')] = view;
    }).bind(this));

    this.$el.find('select').html(frag);

    var router = this.router;
    this.$el.find('.chzn-select').chosen().change(function() {
      router.navigate($(this).val(), true);
    });

    this.sidebar.open();

    this.app.loader.done();

    return this;
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};

    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
