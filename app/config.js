var cookie = require('./cookie');
var oauth = require('../oauth.json');

module.exports = {
  api: process.env.API_URL || oauth.api || 'https://api.github.com',
  apiStatus: process.env.API_STATUS_URL || oauth.status || 'https://status.github.com',
  host: process.env.OAUTH_HOST || oauth.host || 'github.com',
  id: process.env.OAUTH_CLIENT_ID || oauth.clientId,
  gatekeeper: process.env.GATEKEEPER_URL || oauth.gatekeeperUrl,
  username: cookie.get('username'),
  redirect: process.env.REDIRECT_URL || 'http://localhost:3000/',
  gitlab: true,
  prose: process.env.PROSE_URL || '/'
};
