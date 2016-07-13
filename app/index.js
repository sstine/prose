require('./codemirror-syntax-highlights');
var en = require('../dist/en.js');
window.locale.en = en;
window.locale.current('en');
window.app = {};
window.Backbone = Backbone;

var $ = require('jquery');
var Backbone = require('backbone');
window.$ = Backbone.$;
require('chosen-jquery-browserify');

var boot = require('./boot');
window.router = boot();
