# @thomaslilja/nuxt-auth-scheme-cognito

This is a continuation of the work done in https://github.com/sirdiego/nuxt-auth-cognito-scheme.

Compatible with @nuxtjs/auth v4.

## Setup

Install with npm:

```bash
npm install --save @thomaslilja/nuxt-auth-scheme-cognito
```

Install with yarn:

```bash
yarn add @thomaslilja/nuxt-auth-scheme-cognito
```

Edit `nuxt.config.js`:

```js
{
  modules: [
    '@nuxtjs/axios',
    '@thomaslilja/nuxt-auth-scheme-cognito', // Insert before @nuxtjs/auth
    '@nuxtjs/auth'
  ],
  auth: {
    strategies: {
      cognito: {
        tokenType: 'Bearer',
        globalToken: true,
        tokenRequired: true,
        idToken: false, // Set to true to use id_token instead of access_token
        tokenName: 'Authorization',
        autoFetchUser: true,
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        clientId: process.env.AWS_COGNITO_CLIENT_ID,
        refreshInterval: 5 * 60 * 1000, // Set to 0 to disable the browser interval
        fetchUserCallback: false // Can be used to put more information into the user object
      }
    }
  }
}
```

## Usage

```js
this.$auth.loginWith('cognito', { data: { username: this.email, password: this.password } });
```
