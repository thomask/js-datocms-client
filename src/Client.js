/* global fetch */

import queryString from 'query-string';
import { camelizeKeys, decamelizeKeys } from 'humps';
import ApiException from './ApiException';
import pkg from '../package.json';
import isBrowser from './isBrowser';

/* eslint-disable global-require */
if (!isBrowser) {
  global.fetch = require('./fetch');
}
/* eslint-enable global-require */

export default class Client {
  constructor(token, extraHeaders, baseUrl) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.extraHeaders = extraHeaders;
  }

  get(url, params = {}, options = {}) {
    return this.request(
      this.buildUrl(url, params),
      options
    );
  }

  put(url, body, params = {}, options = {}) {
    return this.request(
      this.buildUrl(url, params),
      Object.assign(
        {
          method: 'PUT',
          body: JSON.stringify(decamelizeKeys(body)),
        },
        options
      )
    );
  }

  post(url, body, params = {}, options = {}) {
    return this.request(
      this.buildUrl(url, params),
      Object.assign(
        {
          method: 'POST',
          body: JSON.stringify(decamelizeKeys(body)),
        },
        options
      )
    );
  }

  delete(url, params = {}, options = {}) {
    return this.request(
      this.buildUrl(url, params),
      Object.assign(
        {
          method: 'DELETE',
        },
        options
      )
    );
  }

  defaultHeaders() {
    const userAgent = isBrowser ?
      'js-client (browser)' :
      'js-client (nodejs)';

    return {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${this.token}`,
      'user-agent': `${userAgent} v${pkg.version}`,
    };
  }

  buildUrl(path, params = {}) {
    const query = Object.keys(params).length ?
      `?${queryString.stringify(params)}` :
      '';

    return `${this.baseUrl}${path}${query}`;
  }

  request(url, options = {}) {
    const fullHeaders = Object.assign(
      {},
      this.extraHeaders,
      this.defaultHeaders(),
      options.headers
    );

    const fullOptions = Object.assign(
      {},
      options,
      { headers: fullHeaders }
    );

    return fetch(url, fullOptions)
      .then((res) => {
        if (res.status !== 204) {
          return res.json().then(body => [res, body]);
        }
        return Promise.resolve([res, null]);
      })
      .then(([res, body]) => {
        if (res.status >= 200 && res.status < 300) {
          return Promise.resolve(camelizeKeys(body));
        }
        return Promise.reject(new ApiException(res, camelizeKeys(body)));
      });
  }
}
