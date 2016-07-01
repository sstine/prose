var glob = require('glob');
var path = require('path');
var en = require('./translations/locales/en.json');
var fs = require('fs');

var templates = glob.sync('templates/**/*.html').map(function (file) {
  return {
    html: fs.readFileSync(file, 'utf8'),
    path: file,
    dir: path.dirname(file.replace(/templates\//, '')).split('/'),
    id: path.basename(file, '.html')
  };
});
fs.writeFileSync('dist/templates.js', 'module.exports = ' + JSON.stringify(templates) + ';');

// Default language is english. Cache this as a data for speed.
fs.writeFileSync('dist/en.js', 'module.exports = ' + JSON.stringify(en) + ';');
