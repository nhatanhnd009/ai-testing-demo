type UiConfig = {
  baseUrl: string;
  loginUrl: string;
};

type ApiConfig = {
  apiBaseUrl: string;
};

export type CredentialProfile = {
  username: string;
  password: string;
};

export type CredentialProfileName = 'standardUser';

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadUiConfig(env = process.env): UiConfig {
  return {
    baseUrl: required(env, 'BASE_URL'),
    loginUrl: required(env, 'LOGIN_URL'),
  };
}

export function loadApiConfig(env = process.env): ApiConfig {
  return {
    apiBaseUrl: required(env, 'API_BASE_URL'),
  };
}

export function loadCredentialProfile(
  profile: CredentialProfileName,
  env = process.env,
): CredentialProfile {
  if (profile !== 'standardUser') {
    throw new Error(`Unknown credential profile: ${profile}`);
  }

  return {
    username: required(env, 'TEST_USERNAME'),
    password: required(env, 'TEST_PASSWORD'),
  };
}
