import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadApiConfig,
  loadCredentialProfile,
  loadUiConfig,
} from './environment';

test('loads UI and API configuration', () => {
  const env = {
    BASE_URL: 'https://app.example.test/',
    LOGIN_URL: 'https://app.example.test/login',
    API_BASE_URL: 'https://api.example.test/',
  };

  assert.deepEqual(loadUiConfig(env), {
    baseUrl: env.BASE_URL,
    loginUrl: env.LOGIN_URL,
  });
  assert.deepEqual(loadApiConfig(env), { apiBaseUrl: env.API_BASE_URL });
});

test('resolves the standardUser profile without logging values', () => {
  assert.deepEqual(
    loadCredentialProfile('standardUser', {
      TEST_USERNAME: 'qa-user',
      TEST_PASSWORD: 'not-logged',
    }),
    { username: 'qa-user', password: 'not-logged' },
  );
});

test('reports only the missing variable name', () => {
  assert.throws(
    () =>
      loadCredentialProfile('standardUser', {
        TEST_USERNAME: 'qa-user',
      }),
    /^Error: Missing required environment variable: TEST_PASSWORD$/,
  );
});
