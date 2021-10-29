import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import { UniversalStorageWrapper } from '@thomaslilja/nuxt-auth-scheme-cognito/UniversalStorageWrapper';

if (!process.client || !('fetch' in window)) {
  require('cross-fetch/polyfill');
}

const DEFAULTS = {
  tokenType: 'Bearer',
  globalToken: true,
  tokenRequired: true,
  idToken: false,
  tokenName: 'Authorization',
  autoFetchUser: true,
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  refreshInterval: 5 * 60 * 1000,
  fetchUserCallback: false,
};

export default class CognitoAuthScheme {
  constructor(auth, options) {
    this.$auth = auth;
    this.name = options._name;
    this.options = { ...DEFAULTS, ...options };

    this.$storage = new UniversalStorageWrapper(this.$auth.$storage, this.options.clientId);
    this.$pool = new CognitoUserPool({
      UserPoolId: this.options.userPoolId,
      ClientId: this.options.clientId,
      Storage: this.$storage,
    });
  }

  _setToken(token) {
    if (this.options.globalToken) {
      this.$auth.ctx.app.$axios.setHeader(this.options.tokenName, token);
    }
  }

  _clearToken() {
    if (this.options.globalToken) {
      this.$auth.ctx.app.$axios.setHeader(this.options.tokenName, false);
    }
  }

  async mounted() {
    if (this.options.tokenRequired) {
      const { idToken } = this.options;
      const cognitoUser = this.$pool.getCurrentUser();
      let token = false;
      if (cognitoUser) {
        try {
          token = await new Promise((resolve, reject) => {
            cognitoUser.getSession((err, cognitoUserSession) => {
              if (err) {
                return reject(err);
              }
              if (idToken) {
                return resolve(cognitoUserSession.getIdToken().getJwtToken());
              }
              return resolve(cognitoUserSession.getAccessToken().getJwtToken());
            });
          });
          // eslint-disable-next-line no-empty
        } catch (error) {}
      }

      this._setToken(token);
    }

    return this.$auth.fetchUserOnce();
  }

  _scheduleRefresh() {
    if (
      this.options.refreshInterval &&
      process.client &&
      !this.$auth.$storage.getState('interval') &&
      this.$auth.$state.user
    ) {
      this.$auth.$storage.setState(
        'interval',
        setInterval(() => {
          this.$auth.fetchUser(true);
        }, this.options.refreshInterval)
      );
    }
  }

  async login({ data }) {
    await this.$auth.reset();

    const result = await this._login(data.username, data.password);
    let jwtToken;
    if (this.options.idToken) {
      jwtToken = result.getIdToken().getJwtToken();
    } else {
      jwtToken = result.getAccessToken().getJwtToken();
    }
    const token = this.options.tokenType ? `${this.options.tokenType} ${jwtToken}` : jwtToken;

    this._setToken(token);

    if (this.options.autoFetchUser) {
      await this.fetchUser();
    }

    return result;
  }

  async setUserToken(tokenValue) {
    const token = this.options.tokenType ? `${this.options.tokenType} ${tokenValue}` : tokenValue;
    this._setToken(token);

    return this.fetchUser();
  }

  async fetchUser(forceRefresh) {
    const cognitoUser = this.$pool.getCurrentUser();
    if (cognitoUser === null) {
      return;
    }

    const user = await new Promise((resolve, reject) => {
      const handler = (err, cognitoUserSession) => {
        if (err) {
          return reject(err);
        }

        cognitoUser.getUserAttributes(async (err, attributes) => {
          if (err) {
            return reject(err);
          }

          let user = {};
          attributes.map(({ Name, Value }) => (user[Name] = Value));
          user.groups = cognitoUserSession.getIdToken().payload['cognito:groups'] || [];

          if (this.options.fetchUserCallback) {
            const custom = await this.options.fetchUserCallback(cognitoUser);
            user = { ...user, ...custom };
          }

          return resolve(user);
        });
      };

      return cognitoUser.getSession((error, session) => {
        if (error) {
          return reject(error);
        }

        if (!forceRefresh) {
          return handler(error, session);
        }

        return cognitoUser.refreshSession(session.getRefreshToken(), handler);
      });
    });

    this._scheduleRefresh();
    this.$auth.setUser(user);
  }

  async logout() {
    const cognitoUser = this.$pool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.signOut();
    }

    return this.$auth.reset();
  }

  async reset() {
    if (this.options.tokenRequired) {
      this._clearToken();
    }

    if (process.client) {
      const interval = this.$auth.$storage.getState('interval');
      if (interval) {
        clearInterval(interval);
        this.$auth.$storage.removeState('interval');
      }
    }

    this.$auth.setUser(false);
    this.$storage.clear();

    return Promise.resolve();
  }

  async _login(Username, Password) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username,
        Password,
      });
      const cognitoUser = new CognitoUser({
        Username,
        Pool: this.$pool,
        Storage: this.$storage,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => resolve(result),
        onFailure: (error) => reject(error),
      });
    });
  }
}
