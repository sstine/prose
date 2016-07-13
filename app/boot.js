var Backbone = require('backbone');
$ = Backbone.$;
var Router = require('./router');
var User = require('./models/user');
var NotificationView = require('./views/notification');
var cookie = require('./cookie');
var auth = require('./config');
var api = require('./util').getApiFlavor();

var $prose = $('#prose');
var user = new User();

module.exports = start;
function start () {

  // if browser is too old, bail immediately.
  if (!'withCredentials' in new XMLHttpRequest()) {
    var upgrade = new NotificationView({
      message: t('main.upgrade.content'),
      options: [{
        title: t('main.upgrade.download'),
        link: 'https://www.google.com/intl/en/chrome/browser'
      }]
    });
    $prose.html(upgrade.render().el);
    return;
  }

  // Set up translations
  var lang = cookie.get('lang');
  if (lang) { app.locale = lang; }
  if (app.locale && app.locale !== 'en') {
    $.getJSON('./translations/locales/' + app.locale + '.json', function(result) {
      window.locale[app.locale] = result;
      window.locale.current(app.locale);
    });
  }

  var router = new Router({user: user});

  var token = cookie.get('oauth-token');
  if (!token) {
    var match = window.location.href.match(/\?code=([a-z0-9]*)/);
    if (match) {
      $.ajax({
        url: auth.gatekeeper + '/authenticate/' + match[1],
        success: function (data, resp) {
          if (data.error) {
            return onApiError(null, new Error(data.error));
          }
          cookie.set('oauth-token', data.token);
          var authCode = new RegExp("(?:\\/)?\\?code=" + match[1]);
          window.location.href = window.location.href.replace(authCode, '');
        }
      })
    } else {
      Backbone.history.start();
    }
  }
  else {
    withAuthToken(token);
  }

  return router;
}

function withAuthToken (token) {
  // Set OAuth header for all CORS requests
  var headers = {};
  if (api === 'gitlab') {
    headers.Authorization = 'Bearer ' + token;
  }
  else {
    headers.Authorization = 'token ' + token;
  }
  $.ajaxSetup({headers: headers});
  $prose.addClass('authenticated');
  user.set({
    id: cookie.get('id'),
    login: cookie.get('login')
  });
  user.fetch({
    success: onUserFetch,
    error: onApiError
  });
}

function onUserFetch (model) {
  cookie.set('id', user.get('id'));
  cookie.set('login', user.get('login'));
  Backbone.history.start();
}

function onApiError (model, error) {
  if (error.message === 'bad_code') {
    showApiError();
  }
  else if (api === 'gitlab') {
    // Gitlab returns 401 for unauthorized queries.
    // This is a good proxy to determine api status.
    showApiError({
      status: error.status === 401 ? 'good' : 'bad'
    });
  }
  else if (api === 'github') {
    $.ajax({
      type: 'GET',
      url: 'https://status.github.com/api/status.json?callback=?',
      dataType: 'jsonp',
      success: showApiError
    });
  }
}

function showApiError (context) {
  context = context || {};

  // TODO change the actual message in translation
  var message = t('notification.error.github');
  if (api !== 'github') {
    message = message.replace('Github', auth.host)
  }
  var error = {
    message: message,
    options: [{
      title: t('notification.back'),
      link: auth.prose
    }]
  };

  if (context.status) {
    var statusTitle = t('notification.githubStatus', {
      status: context.status
    });
    if (api !== 'github') {
      statusTitle = statusTitle.replace('GitHub', auth.host);
    }
    error.options.push({
      title: statusTitle,
      link: auth.apiStatus,
      className: context.status
    });
  }

  $prose.html(new NotificationView(error).render().el);
  console.error('Problem authenticating using oauth');
  console.error('Report issues at https://github.com/prose/prose/issues');
  cookie.clear();
}
