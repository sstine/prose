var _ = require('underscore');
var Backbone = require('backbone');

var User = require('./models/user');
var Users = require('./collections/users');
var Orgs = require('./collections/orgs');

var Repo = require('./models/repo');
var File = require('./models/file');

var AppView = require('./views/app');
var NotificationView = require('./views/notification');
var StartView = require('./views/start');
var ProfileView = require('./views/profile');
var SearchView = require('./views/search');
var ReposView = require('./views/repos');
var RepoView = require('./views/repo');
var FileView = require('./views/file');
var DocumentationView = require('./views/documentation');
var ChooseLanguageView = require('./views/chooselanguage');

var util = require('./util');
var auth = require('./config');
var cookie = require('./cookie');

// Convenience method to create a new, empty repo model.
function newRepoModel (name, login) {
  return new Repo({
    name: name,
    owner: {
      // Mimic both github, gitlab property assignment.
      // TODO good target for es6 variable-as-prop-name
      login: login,
      username: login
    }
  });
}

// Set scope
auth.scope = cookie.get('scope') || 'repo';

module.exports = Backbone.Router.extend({

  routes: {
    'about(/)': 'about',
    'chooselanguage(/)': 'chooseLanguage',
    ':user(/)': 'profile',
    ':user/:repo(/)': 'repo',
    ':user/:repo/*path(/)': 'path',
    '*default': 'start'
  },

  initialize: function(options) {
    options = _.clone(options) || {};

    this.users = new Users();

    if (options.user) {
      this.user = options.user;
      this.users.add(this.user);
    }

    // Load up the main layout
    this.app = new AppView({
      el: '#prose',
      model: {},
      user: this.user
    });

    this.app.render();
    this.app.loader.done();
  },

  chooseLanguage: function() {
    if (this.view) this.view.remove();

    this.app.loader.start(t('loading.file'));
    this.app.nav.mode('');

    this.view = new ChooseLanguageView();
    this.app.$el.find('#main').html(this.view.render().el);

    this.app.loader.done();
  },

  about: function() {
    if (this.view) this.view.remove();

    this.app.loader.start(t('loading.file'));
    this.app.nav.mode('');

    this.view = new DocumentationView();
    this.app.$el.find('#main').html(this.view.render().el);

    this.app.loader.done();
  },

  // #example-user
  // #example-organization
  profile: function(login) {
    if (this.view) this.view.remove();

    var loader = this.app.loader;
    loader.start(t('loading.repos'));
    this.app.nav.mode('repos');

    util.documentTitle(login);

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var search = new SearchView({
      model: user.repos,
      mode: 'repos'
    });

    var repos = new ReposView({
      model: user.repos,
      search: search
    });

    var profile = new ProfileView({
      auth: this.user,
      search: search,
      sidebar: this.app.sidebar,
      repos: repos,
      router: this,
      user: user
    });
    this.view = profile;

    var error = function (model, xhr) {
      loader.stop();
      this.error(xhr)
    }.bind(this);

    user.fetch({
      success: (function(model, res, options) {
        this.app.$el.find('#main').html(profile.render().el);
        model.repos.fetch({
          success: function () {
            repos.render();
            loader.stop();
          },
          error: error,
        });
      }).bind(this),
      error: error
    });
  },

  // #example-user/example-repo
  // #example-user/example-repo/tree/example-branch/example-path
  repo: function(login, repoName, branch, path) {
    if (this.view instanceof RepoView &&
      this.view.model.get('owner').login === login &&
      this.view.model.get('name') === repoName &&
      (this.view.branch === branch ||
        (_.isUndefined(branch) &&
        this.view.branch === this.view.model.get('default_branch'))
      )) {
      this.view.files.path = path || '';
      return this.view.files.render();
    } else if (this.view) this.view.remove();

    var loader = this.app.loader;
    loader.start(t('loading.repo'));
    this.app.nav.mode('repo');

    var title = branch ? title = repoName + ': /' + path + ' at ' + branch
      : repoName;
    util.documentTitle(title);

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    // If user has access to repos with the same name,
    // use the repo that matches the login/url, if available.
    // https://github.com/prose/prose/issues/939
    var repos = user.repos.filter(function (model) {
      return model.get('name') === repoName;
    });
    var repo;
    if (repos.length === 1) {
      repo = repos[0];
    } else if (repos.length > 1) {
      // Returns false if there isn't a repo with a matching login.
      // We're fine with that since _.isUndefined(false) === true
      repo = _.find(repos, function (model) {
        return model.get('owner').login === login;
      });
    }

    if (_.isUndefined(repo)) {
      repo = newRepoModel(repoName, login);
      user.repos.add(repo);
    }

    repo.fetch({
      success: (function(model, res, options) {
        var repoView = new RepoView({
          app: this.app,
          branch: branch,
          model: repo,
          nav: this.app.nav,
          path: path,
          router: this,
          sidebar: this.app.sidebar
        });

        this.view = repoView;
        this.app.$el.find('#main').html(repoView.render().el);
        loader.stop();
      }).bind(this),
      error: (function(model, xhr, options) {
        loader.stop();
        this.error(xhr);
      }).bind(this),
    });
  },

  path: function(login, repoName, path) {
    var url = util.extractURL(path);

    switch(url.mode) {
      case 'tree':
        this.repo(login, repoName, url.branch, url.path);
        break;
      case 'new':
      case 'blob':
      case 'edit':
      case 'preview':
        this.post(login, repoName, url.mode, url.branch, url.path);
        break;
      default:
        throw url.mode;
    }
  },

  post: function(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    this.app.nav.mode('file');
    var loader = this.app.loader;

    switch(mode) {
      case 'new':
        loader.start(t('loading.creating'));
        break;
      case 'edit':
        loader.start(t('loading.file'));
        break;
      case 'preview':
        loader.start(t('loading.preview'));
        break;
    }

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var repo = user.repos.findWhere({ name: repoName });
    if (_.isUndefined(repo)) {
      repo = newRepoModel(repoName, login);
      user.repos.add(repo);
    }

    var file = {
      app: this.app,
      branch: branch,
      branches: repo.branches,
      mode: mode,
      nav: this.app.nav,
      name: util.extractFilename(path)[1],
      path: path,
      repo: repo,
      router: this,
      sidebar: this.app.sidebar
    };

    // TODO: defer this success function until both user and repo have been fetched
    // in parallel rather than in series
    user.fetch({
      success: (function(model, res, options) {
        repo.fetch({
          success: (function(model, res, options) {
            this.view = new FileView(file);
            this.app.$el.find('#main').html(this.view.el);
            loader.stop();
          }).bind(this),
          error: error
        });
      }).bind(this),
      error: error
    });

    var error = function (model, xhr) {
      this.error(xhr);
      loader.stop();
    }.bind(this);
  },

  preview: function(login, repoName, mode, branch, path) {
    if (this.view) this.view.remove();

    var loader = this.app.loader;
    loader.start(t('loading.preview'));

    var user = this.users.findWhere({ login: login });
    if (_.isUndefined(user)) {
      user = new User({ login: login });
      this.users.add(user);
    }

    var repo = user.repos.findWhere({ name: repoName });
    if (_.isUndefined(repo)) {
      repo = newRepoModel(repoName, login);
      user.repos.add(repo);
    }

    var file = {
      branch: branch,
      branches: repo.branches,
      mode: mode,
      nav: this.app.nav,
      name: util.extractFilename(path)[1],
      path: path,
      repo: repo,
      router: this,
      sidebar: this.app.sidebar
    };

    repo.fetch({
      success: (function(model, res, options) {
        // TODO: should this still pass through File view?
        this.view = new Preview(file);
        this.app.$el.find('#main').html(this.view.el);
        loader.stop();
      }).bind(this),
      error: (function(model, xhr, options) {
        this.error(xhr);
        loader.stop();
      }).bind(this)
    });
  },

  start: function() {
    if (this.view) this.view.remove();

    // If user has authenticated
    if (this.user.get('login')) {
      this.navigate(this.user.get('login'), {
        trigger: true,
        replace: true
      });
    } else {
      this.app.nav.mode('start');
      this.view = new StartView();
      this.app.$el.find('#main').html(this.view.render().el);
    }
  },

  notify: function(message, error, options) {
    if (this.view) this.view.remove();

    this.view = new NotificationView({
      message: message,
      error: error,
      options: options
    });

    this.app.$el.find('#main').html(this.view.render().el);
    this.app.loader.stop();
  },

  error: function(xhr) {
    var message = [
      xhr.status,
      xhr.statusText
    ].join(' ');

    var error = util.xhrErrorMessage(xhr);

    var options = [
      {
        title: t('notification.home'),
        link: auth.prose
      }
    ];

    if (xhr.status === 404 && !this.user) {
      error = t('notification.404');
      options.unshift({
        title: t('login'),
        link: util.oauthUrl(util.getApiFlavor(), auth.scope)
      });
    }

    cookie.clear();
    console.error('There was a problem retrieving data\n' +
                  'You may need to re-authenticate\n' +
                  'Report issues at https://github.com/prose/prose/issues\n' +
                  'Dumping cookies');

    this.notify(message, error, options);
  }
});
