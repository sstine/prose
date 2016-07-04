var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var File = require('../models/file');
var Folder = require('../models/folder');
var FileView = require('./li/file');
var FolderView = require('./li/folder');
var templates = require('../../templates');
var util = require('.././util');

function validatePath (path) {
  if (!path) {
    return '';
  }
  else if (path.slice(-1) === '/') {
    return path;
  }
  else {
    return path + '/';
  }
}

module.exports = Backbone.View.extend({
  className: 'listings',

  template: templates.files,

  subviews: {},

  events: {
    'mouseover .item': 'activeListing',
    'mouseover .item a': 'activeListing',
    'click .breadcrumb a': 'navigate',
    'click .item a': 'navigate'
  },

  initialize: function(options) {
    var app = options.app;
    app.loader.start();

    this.app = app;
    this.branch = options.branch || options.repo.get('default_branch');
    this.branches = options.branches;
    this.history = options.history;
    this.nav = options.nav;
    this.path = options.path || '';
    this.repo = options.repo;
    this.router = options.router;
    this.search = options.search;
    this.sidebar = options.sidebar;

    this.branches.fetch({
      success: this.setCollection.bind(this),
      error: function(model, xhr) {
        options.router.error(xhr);
      }
    });
  },

  setCollection: function() {
    var files = this.branches.findWhere({ name: this.branch }).files;
    this.collection = files;
    this.listenToOnce(files, 'sync', function () {
      // Update this.path with rooturl
      // TODO not sure if this is always undefined...
      var config = files.config;
      this.rooturl = config && config.rooturl ? config.rooturl : '';
      this.presentationModel = files.filteredModel || files;
      this.search.model = this.presentationModel;
      // Render on fetch and on search
      this.listenTo(this.search, 'search', this.render);
      this.render();
    });
    var router = this.router;
    files.fetch({
      error: function(model, xhr) { router.error(xhr); },
      reset: true
    });
  },

  render: function() {

    var search = this.search && this.search.input && this.search.input.val();
    var rooturl = validatePath(this.rooturl);
    var path = validatePath(this.path);
    var drafts;

    var url = [
      this.repo.get('owner').login,
      this.repo.get('name'),
      'tree',
      this.branch
    ].join('/');

    // Set rooturl jail from collection config
    var regex = new RegExp('^' + (path ? path : rooturl) + '[^\/]*$');

    // Render drafts link in sidebar as subview
    // if _posts directory exists and path does not begin with _drafts
    if (this.presentationModel.get('_posts') && /^(?!_drafts)/.test(this.path)) {
      drafts = this.sidebar.initSubview('drafts', {
        link: [url, '_drafts'].join('/'),
        sidebar: this.sidebar
      });

      this.subviews['drafts'] = drafts;
      drafts.render();
    }

    var data = {
      path: path,
      parts: util.chunkedPath(this.path),
      rooturl: rooturl,
      url: url
    };

    this.$el.html(this.template(data));

    // if not searching, filter to only show current level
    var collection = search ? this.search.search() : this.presentationModel.filter((function(file) {
      return regex.test(file.get('path'));
    }).bind(this));

    var frag = document.createDocumentFragment();
    var opts = {
      branch: this.branch,
      history: this.history,
      repo: this.repo,
      router: this.router
    };
    var subviews = this.subviews;
    collection.each(function(file, index) {
      var _opts = _.extend({}, opts, {
        index: index,
        model: file
      });
      var view = file instanceof File ? new FileView(_opts) : new FolderView(_opts);
      frag.appendChild(view.render().el);
      subviews[file.id] = view;
    });
    this.$el.find('ul').html(frag);
    this.app.loader.stop();
    return this;
  },

  activeListing: function(e) {
    var $listing = $(e.target);

    if (!$listing.hasClass('item')) {
      $listing = $(e.target).closest('li');
    }

    this.$el.find('.item').removeClass('active');
    $listing.addClass('active');

    // Blur out search if its selected
    this.search.$el.blur();
  },

  navigate: function(e) {
    var target = e.currentTarget;
    var path = target.href.split('#')[1];
    var match = path.match(/tree\/([^\/]*)\/?(.*)$/);

    if (e && match) {
      e.preventDefault();

      this.path = match ? match[2] : path;
      this.render();

      this.router.navigate(path);
    }
  },

  remove: function() {
    _.invoke(this.subviews, 'remove');
    this.subviews = {};
    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
