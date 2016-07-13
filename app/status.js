var auth = require('./config');
var $ = require('jquery');

module.exports = {
  githubApi: function(cb) {
    $.ajax({
      type: 'GET',
      url: auth.apiStatus + '?callback=?',
      dataType: 'jsonp',
      success: function(res) {
        return cb(res);
      }
    });
  }
}
