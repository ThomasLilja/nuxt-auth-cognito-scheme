module.exports = function () {
  this.options.build.transpile.push('@thomaslilja/nuxt-auth-scheme-cognito');

  this.options.auth = this.options.auth || {};
  this.options.auth.strategies = this.options.auth.strategies || {};
  this.options.auth.strategies.cognito = this.options.auth.strategies.cognito || {};
  this.options.auth.strategies.cognito._scheme = '@thomaslilja/nuxt-auth-scheme-cognito/CognitoAuthScheme';
};

module.exports.meta = require('./package.json');
