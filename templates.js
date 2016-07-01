var fs = require('fs');
var _ = require('underscore');
var paths = require('./dist/templates')

// Builds html partials into a distributable object to keep index.html clean
var templates = paths.reduce(function(memo, file) {

  var val = _.template(file.html, {variable: 'data'})
  var dir = file.dir;
  var id = file.id;

  if (dir[0].length > 1) {
    function assign(obj, arr, value) {
      var lastIndex = arr.length - 1;
      for (var i = 0; i < lastIndex; ++ i) {
        var key = arr[i];
        if (!(key in obj)) {
          obj[key] = {}
        }
        obj = obj[key];
      }
      obj[arr[lastIndex]] = value;
    }

    dir.push(id);
    assign(memo, dir, val);
  } else {
    // This file is contained in the root dir
    memo[id] = val;
  }

  return memo;
}, {});

module.exports = templates;
